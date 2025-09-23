/**
 * Files Module
 */

import { FilesUploadController } from './controllers/files-upload.controller';
import { FilesListController } from './controllers/files-list.controller';
import { FilesGetController } from './controllers/files-get.controller';
import { FilesDeleteController } from './controllers/files-delete.controller';
import { FilesCopyController } from './controllers/files-copy.controller';
import { FilesSasController } from './controllers/files-sas.controller';
import { FilesService } from './services/files.service';
import { BlobStorageService } from '../../common/services/blob-storage.service';

export class FilesModule {
  static controllers = [
    FilesUploadController,
    FilesListController,
    FilesGetController,
    FilesDeleteController,
    FilesCopyController,
    FilesSasController,
  ];
  static services = [FilesService, BlobStorageService];
  static exports = [FilesService, BlobStorageService];
}
