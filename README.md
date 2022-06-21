# Storage-API
*For development &amp; educational purposes only.*

## Usage
```
npm install
npm start
```

This will start a server listening on port 3000 (http://localhost:3000)

See example requests in `requests.http`.

## Commands

### Get list of data in a given store:

```
GET http://localhost:3000/example
```
This will return a list of files as a json array. Result:

```json
[
  'test'
]
```

### Get contents of a data within a given store
```
GET http://localhost:3000/example
```
Result:
```json
{
  "Status": "Okay",
  "Message": "This is a test json file"
}
```


### Store (and update) data within a given store
```
POST http://localhost:3000/example/newdata
```
Result: 200-OK is returned, a `newdata.json` file will be saved under storage\example.


