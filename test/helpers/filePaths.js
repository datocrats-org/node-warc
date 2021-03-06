import path from 'path'

export const files = path.join(__dirname, '../files')

export const warcs = { gzipped: path.join(files, 'parseMe.warc.gz'), notGz: path.join(files, 'parseMe.warc') }
export const requestsJson = path.join(files, 'rawRequests2.json')
export const capturedReqTestData = path.join(files, 'capturedReqTestData.json')
export const booksToScrapeWARC = path.join(files, 'books.toscrape.warc')
export const fakeResponse = path.join(files, 'fakeResponse.txt')
