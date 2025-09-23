/**
 * Main Entry Point
 *
 * Bootstrap the application following NestJS patterns
 * Registers all Azure Functions from modular controllers
 */

// Import all controllers to ensure Azure Functions are registered
import './modules/health/controllers/health.controller';
import './modules/files/controllers/files-upload.controller';

// Import the app module for organization (optional)
import { AppModule } from './app.module';

/**
 * Application Bootstrap
 * This function would be called if we were using a traditional framework
 * With Azure Functions, the registration happens through imports
 */
export async function bootstrap() {
  // In a real NestJS app, this would create and start the application
  // For Azure Functions, we just need to ensure all controllers are imported
  console.log('Azure Functions Storage Manager API');
  console.log('Modules loaded:', AppModule.modules.length);
  console.log('Controllers registered via imports');
}
