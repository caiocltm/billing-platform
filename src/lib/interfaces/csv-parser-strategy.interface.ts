export interface CSVParserStrategy {
  parse(line: string): string[];
  delimiter: string;
}
