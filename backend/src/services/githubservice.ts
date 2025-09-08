import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class GitHubService {
  
  // Verify webhook signature for security
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!signature || !payload) {
        if (process.env.NODE_ENV !== 'production') console.log('Missing signature or payload');
        return false;
      }

      const secret = process.env.GITHUB_WEBHOOK_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV !== 'production') console.log('No webhook secret configured');
        return false;
      }

      // Support both sha256 (preferred) and legacy sha1 signatures
      const [alg, sigHex] = signature.split('=');
      if (!alg || !sigHex) return false;

      const algo = alg.toLowerCase();
      if (algo !== 'sha256' && algo !== 'sha1') return false;

      const hmac = crypto.createHmac(algo as any, secret);
      const expected = `${algo}=` + hmac.update(payload, 'utf8').digest('hex');

      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(signature, 'utf8');

      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.log('Signature verification error:', e);
      return false;
    }
  }

  // Process push events (commits)
  async handlePushEvent(payload: any) {
    const commits = payload?.commits ?? [];
    const repoName = payload?.repository?.full_name ?? 'unknown/repo';
    if (!Array.isArray(commits) || commits.length === 0) return;
    for (const commit of commits) {
      if (!commit?.message || !commit?.id) continue;
      await this.processCommitMessage(commit.message, commit.id, repoName);
    }
  }

  // Process pull request events
  async handlePullRequestEvent(payload: any) {
    const { action, pull_request, repository } = payload;
    
    if (action === 'closed' && pull_request.merged) {
      // PR was merged - move related tasks to Done
      await this.handleMergedPR(pull_request, repository.full_name);
    }
  }

  // Extract task references from commit messages
  private async processCommitMessage(message: string, commitId: string, repoName: string) {
    // Look for task references like "VALEX-123" or "closes VALEX-456"
    const taskPattern = /(?:closes?|fixes?|resolves?)\s+([A-Z]+-\d+)|([A-Z]+-\d+)/gi;
    const matches = [...message.matchAll(taskPattern)];
    
    for (const match of matches) {
      const taskKey = match[1] || match[2];
      const isClosing = match[1] !== undefined;
      
      await this.updateTaskFromCommit(taskKey, commitId, repoName, isClosing, message);
    }
  }

  // Update task based on commit
  private async updateTaskFromCommit(
    taskKey: string, 
    commitId: string, 
    repoName: string, 
    isClosing: boolean,
    commitMessage: string
  ) {
    try {
      const task = await prisma.task.findUnique({
        where: { key: taskKey },
        include: { 
          project: true,
          column: true
        }
      });

      if (!task) return;

      // Add commit as a comment
      if (process.env.NODE_ENV !== 'production') {
        console.log('Creating commit comment for task:', taskKey);
        console.log('Task found:', !!task);
        console.log('Task creator ID:', task.creatorId);
      }
      await prisma.comment.create({
        data: {
            content: `🔗 **Commit linked:** ${commitMessage}\n\nCommit: \`${commitId.substring(0, 7)}\`\nRepository: ${repoName}`,
            taskId: task.id,
            authorId: task.creatorId
        }
    });
    if (process.env.NODE_ENV !== 'production') console.log('Comment created successfully');

      // If commit message indicates task completion, move to Done
      if (isClosing) {
        const doneColumn = await prisma.column.findFirst({
          where: { 
            projectId: task.projectId,
            isDefault: true // Done column
          }
        });

        if (doneColumn && task.columnId !== doneColumn.id) {
          await prisma.task.update({
            where: { id: task.id },
            data: { 
              columnId: doneColumn.id,
              status: 'DONE',
              completedAt: new Date()
            }
          });

          if (process.env.NODE_ENV !== 'production') console.log(`Task ${taskKey} moved to Done due to commit ${commitId.substring(0, 7)}`);
        }
      }

    } catch (error) {
      console.error(`Failed to update task ${taskKey}:`, error);
    }
  }

  // Handle merged pull requests
  private async handleMergedPR(pullRequest: any, repoName: string) {
    const prTitle = pullRequest.title;
    const prBody = pullRequest.body || '';
    const combinedText = `${prTitle} ${prBody}`;
    
    // Look for task references in PR title and body
    const taskPattern = /(?:closes?|fixes?|resolves?)\s+([A-Z]+-\d+)|([A-Z]+-\d+)/gi;
    const matches = [...combinedText.matchAll(taskPattern)];
    
    for (const match of matches) {
      const taskKey = match[1] || match[2];
      await this.moveTaskToDone(taskKey, pullRequest.number, repoName);
    }
  }

  // Move task to Done column when PR is merged
  private async moveTaskToDone(taskKey: string, prNumber: number, repoName: string) {
    try {
      const task = await prisma.task.findUnique({
        where: { key: taskKey },
        include: { project: true }
      });

      if (!task) return;

      const doneColumn = await prisma.column.findFirst({
        where: { 
          projectId: task.projectId,
          isDefault: true
        }
      });

      if (doneColumn) {
        await prisma.task.update({
          where: { id: task.id },
          data: { 
            columnId: doneColumn.id,
            status: 'DONE',
            completedAt: new Date()
          }
        });

        // Add PR comment
        await prisma.comment.create({
          data: {
            content: `🎉 **Pull Request merged!** \n\nPR #${prNumber} was merged in ${repoName}. Task automatically moved to Done.`,
            taskId: task.id,
            authorId: task.creatorId
          }
        });

        if (process.env.NODE_ENV !== 'production') console.log(`Task ${taskKey} completed via PR #${prNumber}`);
      }

    } catch (error) {
      console.error(`Failed to complete task ${taskKey}:`, error);
    }
  }
}
