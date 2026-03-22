export interface Settings {
  [key: string]: unknown;

  // Scrapers
  "scraper.movie.aventertainment": boolean;
  "scraper.movie.aventertainmentja": boolean;
  "scraper.movie.r18dev": boolean;
  "scraper.movie.dmm": boolean;
  "scraper.movie.dmmja": boolean;
  "scraper.movie.jav321ja": boolean;
  "scraper.movie.javbus": boolean;
  "scraper.movie.javbusja": boolean;
  "scraper.movie.javbuszh": boolean;
  "scraper.movie.javdb": boolean;
  "scraper.movie.javdbzh": boolean;
  "scraper.movie.javlibrary": boolean;
  "scraper.movie.javlibraryja": boolean;
  "scraper.movie.javlibraryzh": boolean;
  "scraper.movie.mgstageja": boolean;
  "scraper.movie.tokyohot": boolean;
  "scraper.movie.tokyohotja": boolean;
  "scraper.movie.tokyohotzh": boolean;

  // Locations
  "location.input": string;
  "location.output": string;
  "location.thumbcsv": string;
  "location.genrecsv": string;
  "location.uncensorcsv": string;
  "location.historycsv": string;
  "location.tagcsv": string;
  "location.log": string;

  // Sort options
  "sort.movetofolder": boolean;
  "sort.renamefile": boolean;
  "sort.create.nfo": boolean;
  "sort.download.thumbimg": boolean;
  "sort.download.posterimg": boolean;
  "sort.download.screenshotimg": boolean;
  "sort.download.trailervid": boolean;
  "sort.download.actressimg": boolean;

  // Format strings
  "sort.format.file": string;
  "sort.format.folder": string;
  "sort.format.posterimg": string[];
  "sort.format.thumbimg": string;
  "sort.format.nfo": string;

  // Emby
  "emby.url": string;
  "emby.apikey": string;

  // Theme
  "web.theme": string;
}

export interface MovieData {
  Id: string;
  ContentId: string;
  Title: string;
  AlternateTitle: string;
  Description: string;
  Rating: number;
  ReleaseDate: string;
  Runtime: number;
  Director: string;
  Maker: string;
  Label: string;
  Series: string;
  Actress: { LastName: string; FirstName: string; JapaneseName: string; ThumbUrl: string }[];
  Genre: string[];
  CoverUrl: string;
  ScreenshotUrl: string[];
  TrailerUrl: string;
  Tag: string[];
}

export interface ScanResultItem {
  Data: MovieData | null;
  PartNumber: number;
  Url: string;
  Path: string;
}
