import { Webhooks } from '@octokit/webhooks';
import { PushEvent } from '@octokit/webhooks-types';
import { blue, green } from 'colors/safe';
import simpleGit from 'simple-git';

import type { EmitterWebhookEventWithStringPayloadAndSignature } from '@octokit/webhooks/dist-types/types';

import { prepareErrorForLogging } from 'utilities/error';
import { exec } from 'utilities/process';

export default class GithubClient {
  private readonly git = simpleGit({
    baseDir: process.cwd(),
  });
  private readonly webhooks = new Webhooks({
    secret: process.env.WEBHOOK_SECRET ?? '',
  });

  constructor() {
    this.webhooks.on('push', async ({ payload }) => {
      try {
        await this.processPushEvent(payload);
      } catch (err) {
        console.log(prepareErrorForLogging(err));
      }
    });
  }

  async handleEvent(options: EmitterWebhookEventWithStringPayloadAndSignature): Promise<void> {
    await this.webhooks.verifyAndReceive(options);
  }

  private async processPushEvent(pushEvent: PushEvent): Promise<void> {
    const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    const isCurrent = pushEvent.ref === `refs/heads/${currentBranch}`;

    await this.git.fetch();

    if (!isCurrent) {
      return;
    }

    const hashBefore = await this.git.revparse('HEAD');

    await this.git.pull();

    const hashAfter = await this.git.revparse('HEAD');

    if (hashBefore === hashAfter) {
      return;
    }

    const diff = await this.git.diffSummary([`${hashBefore}..${hashAfter}`]);
    const hasPackageLockChanged = diff.files.some(({ file }) => file === 'package-lock.json');

    if (hasPackageLockChanged) {
      console.log(blue('Installing new modules...'));

      await exec('npm ci');

      console.log(green('New modules installed...'));
    }

    // TODO: notify about restart

    process.exit(0);
  }
}
