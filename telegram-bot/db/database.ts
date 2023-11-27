import path from 'node:path';

import fs from 'fs-extra';

interface UserFirstState {
  type: 'first';
}

interface UserWaitingState {
  type: 'waiting';
}

interface UserAddTorrentState {
  type: 'addTorrent';
}

export type UserState = UserFirstState | UserWaitingState | UserAddTorrentState;

interface UserData {
  readonly state: UserState;
}

type DbData = {
  usersData: Partial<Record<number, UserData>>;
};

const DB_FILE = path.resolve('./telegram-bot/db/db.json');

class Database {
  static savePromise = Promise.resolve();

  dbData: DbData;

  constructor() {
    try {
      this.dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (err) {
      this.dbData = {
        usersData: {},
      };
    }
  }

  getUserData(userId: number): UserData {
    let userData = this.dbData.usersData[userId];

    if (!userData) {
      userData = {
        state: {
          type: 'first',
        },
      };

      this.setUserData(userId, userData);
    }

    return userData;
  }

  setUserData(userId: number, userData: UserData): void {
    this.dbData.usersData[userId] = userData;

    this.save();
  }

  save(): void {
    Database.savePromise = (async () => {
      await Database.savePromise;

      await fs.writeJson(DB_FILE, this.dbData);
    })();
  }
}

export default Database;
