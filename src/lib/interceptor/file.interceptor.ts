import { FileInterceptor } from '@nestjs/platform-express';
import { StreamStorageEngine } from '../multer/stream-storage.engine';
import { CSVSerializer } from '../serializer/csv.serializer';

export default FileInterceptor('file', {
  storage: new StreamStorageEngine(new CSVSerializer()),
});
