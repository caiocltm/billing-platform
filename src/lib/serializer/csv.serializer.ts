import { CSVParserStrategy } from '../interfaces/csv-parser-strategy.interface';
import { DataTransformer } from '../interfaces/data-transformer.interface';

export class SimpleCsvParser implements CSVParserStrategy {
  public readonly delimiter: string;

  constructor(delimiter = ',') {
    this.delimiter = delimiter;
  }

  parse(line: string): string[] {
    return line.split(this.delimiter).map((value) => value.trim());
  }
}

class ArrayToObjectTransformer
  implements DataTransformer<[string[], string[]], object>
{
  transform(data: [headers: string[], values: string[]]): object {
    const [headers, values] = data;

    return headers.reduce(
      (acc, header, index) => {
        acc[header] = values[index];

        return acc;
      },
      {} as { [key: string]: string },
    );
  }
}

export class CSVSerializer {
  constructor(
    private readonly parserStrategy: CSVParserStrategy = new SimpleCsvParser(),
    private readonly transformer: DataTransformer<
      [string[], string[]],
      object
    > = new ArrayToObjectTransformer(),
  ) {
    this.parserStrategy = parserStrategy;
    this.transformer = transformer;
  }

  public serialize(csvContent: string, headers: string[]): object[] {
    const lines = csvContent.split('\n');
    let incompleteLine: string = '';

    const result = lines
      .map((line) => {
        let values: string[] = [];

        if (incompleteLine !== '') {
          values = this.parserStrategy.parse(incompleteLine + line);

          incompleteLine = '';
        }

        values = this.parserStrategy.parse(line);

        if (values.length === headers.length)
          return this.transformer.transform([headers, values]);

        if (values.length > headers.length) return null;

        incompleteLine = line;
      })
      .filter(Boolean) as object[];

    return result;
  }
}
