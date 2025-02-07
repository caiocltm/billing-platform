import { FileInterceptor } from '@nestjs/platform-express';
import { StreamStorageEngine } from '../multer/stream-storage.engine';

export default FileInterceptor('file', {
  storage: new StreamStorageEngine(),
});
