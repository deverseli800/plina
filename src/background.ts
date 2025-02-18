import Browser from 'webextension-polyfill';
import { initTracker } from './tracker';
import { logger } from './utils/logger';
import { scheduleJobs } from './jobs/sheduler';
import { Settings } from './functions/settings';
import { StorageParams } from './storage/storage-params';
import { injectStorage } from './storage/inject-storage';
import { todayLocalDate } from './utils/date';
import { checkPomodoro } from './functions/pomodoro';
import { Messages } from './utils/messages';
import { injectTabsRepositorySingleton } from './repository/inject-tabs-repository';

logger.log('Start background script');
let pomodoroTimer: number;

self.onerror = err => {
  console.error('Unhandled error:', err);
};

Browser.storage.onChanged.addListener(async (changes, namespace) => {
  for (var key in changes) {
    if (Object.values(StorageParams).includes(key as StorageParams))
      await Settings.getInstance().reloadSetting(key as StorageParams);

    if (key == StorageParams.IS_POMODORO_ENABLED) {
      const value = changes[StorageParams.IS_POMODORO_ENABLED].newValue;
      pomodoro(value);
    }
  }
});

Browser.runtime.setUninstallURL('https://webtracker.online/goodbye.html');

Browser.runtime.onInstalled.addListener(async details => {
  if (details.reason == 'install') {
    logger.log('Extension installed:', details);
    const settingsStorage = injectStorage();
    await settingsStorage.saveValue(StorageParams.INSTALL_DATE, todayLocalDate());

    const initialPageUrl = Browser.runtime.getURL('src/welcome.html');
    await Browser.tabs.create({
      url: initialPageUrl,
      active: true,
    });
  }
  if (details.reason == 'update' && !details.previousVersion) {
    const showChangelog = (await Settings.getInstance().getSetting(
      StorageParams.SHOW_CHANGELOG,
    )) as boolean;
    if (showChangelog)
      await Browser.tabs.create({
        url: 'https://webtracker.online/releasenotes.html',
        active: true,
      });
  }
});

Browser.runtime.onStartup.addListener(() => {
  logger.log(`onStartup event`);
});

Browser.windows.onFocusChanged.addListener(() => {
  logger.log('onFocusChanged');
});

async function pomodoro(value?: boolean) {
  if (value == undefined) {
    const settingsStorage = injectStorage();
    value = await settingsStorage.getValue(StorageParams.IS_POMODORO_ENABLED);
  }
  if (value == true) pomodoroTimer = setInterval(checkPomodoro, 1000);
  else clearInterval(pomodoroTimer);
}

pomodoro();
scheduleJobs();
initTracker();

Browser.runtime.onMessage.addListener(async message => {
  if (message == Messages.ClearAllData) {
    const storage = injectStorage();
    const repo = await injectTabsRepositorySingleton();
    repo.removeAllTabs();
    await storage.saveTabs([]);
  }
  if (message.message == Messages.Restore) {
    const storage = injectStorage();
    await storage.saveTabs(message.data);
    const repo = await injectTabsRepositorySingleton();
    repo.initAsync();
  }
});

Browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log("***** change!", changeInfo, tab.url)
  if (changeInfo.status === 'complete' && tab.url?.startsWith('chrome://newtab/')) {
    console.log('New tab page detected, injecting scripts');

    try {
      console.log('Executing content scripts...');
      await Browser.scripting.executeScript({
        target: { tabId },
        files: ['src/content-scripts/overlay.js', 'src/newtab.js']
      });
      console.log('Content scripts executed successfully');

      console.log('Inserting CSS...');
      await Browser.scripting.insertCSS({
        target: { tabId },
        files: [
          'assets/css/dark.css',
          'assets/css/main.css',
          'assets/css/general.css'
        ]
      });
      console.log('CSS inserted successfully');
    } catch (err) {
      console.error('Failed to inject scripts:', err);
      // Log more detailed error information
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
      }
    }
  }
});
