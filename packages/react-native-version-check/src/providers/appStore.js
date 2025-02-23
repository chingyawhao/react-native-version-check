// @flow
import { getVersionInfo } from '../versionInfo';

import { IProvider, IVersionAndStoreUrl } from './types';

export type AppStoreGetVersionOption = {
  country?: string,
  packageName?: string,
  fetchOptions?: any,
  ignoreErrors?: boolean,
};

export interface IAppStoreProvider extends IProvider {
  getVersion: AppStoreGetVersionOption => Promise<IVersionAndStoreUrl>;
}

class AppStoreProvider implements IProvider {
  async getVersion(
    option: AppStoreGetVersionOption
  ): Promise<IVersionAndStoreUrl> {
    const opt = option;
    try {
      if (!opt.country) {
        opt.country = await getVersionInfo().getCountry();
      }
      if (!opt.packageName) {
        opt.packageName = getVersionInfo().getPackageName();
      }
      const countryCode = opt.country ? `${opt.country}/` : '';
      const dateNow = new Date().getTime();

      return fetch(
        `https://itunes.apple.com/${countryCode}lookup?bundleId=${opt.packageName}&date=${dateNow}`,
        opt.fetchOptions
      )
        .then(res => res.json())
        .then(json => {
          if (json.resultCount) {
            const result = json.results[0];
            const version = result.version;
            const updatedTime = (() => {
              const datetime = result.currentVersionReleaseDate
                ? Date.parse(result.currentVersionReleaseDate)
                : undefined;

              return datetime ? new Date(datetime) : undefined;
            })();
            const appId = result.trackId;
            const storeUrl = `itms-apps://apps.apple.com/${countryCode}app/id${appId}`;
            return Promise.resolve({
              version,
              updatedTime,
              storeUrl,
            });
          }
          return Promise.reject('No info about this app.');
        });
    } catch (e) {
      if (opt.ignoreErrors) {
        console.warn(e); // eslint-disable-line no-console
      } else {
        throw e;
      }
    }
  }
}

export default new AppStoreProvider();
