import { Webhooks } from '@octokit/webhooks';
import { PushEvent } from '@octokit/webhooks-types';
import simpleGit from 'simple-git';

import { prepareErrorForLogging } from 'utilities/error';
import { exec } from 'utilities/process';

export default class GithubClient {
  private git = simpleGit({
    baseDir: process.cwd(),
  });
  readonly webhooks = new Webhooks({
    secret: process.env.WEBHOOK_SECRET ?? '',
  });

  constructor() {
    this.webhooks.on('push', async ({ payload }) => {
      try {
        await this.processWebhookData(payload);
      } catch (err) {
        console.log(prepareErrorForLogging(err));
      }
    });
  }

  private async processWebhookData(pushEvent: PushEvent): Promise<void> {
    const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    const isCurrent = pushEvent.ref === `refs/heads/${currentBranch}`;

    await this.git.fetch();

    if (!isCurrent) {
      return;
    }

    await this.git.pull();

    const diff = await this.git.diffSummary([`${pushEvent.before}..${pushEvent.after}`]);
    const hasPackageLockChanged = diff.files.some(({ file }) => file === 'package-lock.json');

    if (hasPackageLockChanged) {
      await exec('npm ci');
    }

    // TODO: notify about restart

    process.exit(0);
  }
}
