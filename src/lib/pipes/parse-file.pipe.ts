import { HttpStatus, ParseFilePipeBuilder } from '@nestjs/common';

const MAX_FILE_SIZE = 11000000000;
const FILE_TYPE = 'text/csv';

const parseFile = new ParseFilePipeBuilder()
  .addFileTypeValidator({
    fileType: FILE_TYPE,
  })
  .addMaxSizeValidator({
    maxSize: MAX_FILE_SIZE,
  })
  .build({
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    fileIsRequired: true,
  });

export default parseFile;
