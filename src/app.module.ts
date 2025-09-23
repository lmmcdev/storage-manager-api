/**
 * App Module
 *
 * Root module following NestJS architecture patterns
 */

import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

export class AppModule {
  static modules = [FilesModule, HealthModule, AuthModule];

  static getControllers(): any[] {
    return this.modules.flatMap((module: any) => module.controllers || []);
  }

  static getServices(): any[] {
    return this.modules.flatMap((module: any) => module.services || []);
  }

  static getExports(): any[] {
    return this.modules.flatMap((module: any) => module.exports || []);
  }
}
