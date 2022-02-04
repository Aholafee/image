 const express = require('express')
 const path = require('path')
 const crypto = require('crypto')
 const mongoose = require('mongoose')
 const multer = require('multer')
 const {GridFsStorage} = require('multer-gridfs-storage');
 const Grid = require('gridfs-stream')
 const methodOveride = require('method-override')
 const cors = require('cors')



const app = express();

app.use(cors())
app.use(express.json())
// app.use(methodOveride())

const mongoURI = 'mongodb+srv://ahola:Kanefee1001@cluster0.yb7vk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

const conn =  mongoose.createConnection(mongoURI)

let gfs;

conn.once('open', function() {
    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('uploads');
})

let storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });


  const upload = multer({ storage });


//   routes 
  app.post('/upload', upload.single('file'), (req, res) => {
    res.json(req.file)
  })


  app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
      if(!files || files.length === 0) {
        res.status(500).json({err : 'no files exist'})
        return
      }

      res.json(files)
    } )
  })

  app.get('/file/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
      if(!file) {
        res.status(500).json({err : 'no files exist'})
        return
      }

      res.json(file)
    })
  })

  app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
      if(!file) {
        res.status(500).json({err : 'no files exist'})
        return
      }
      // check if images
      if (file.contentType === 'image/jpg' || file.contentType == 'image/png' || file.contentType == 'image/jpeg') {
        const readstream = gfs.createReadStream(file.filename)
          readstream.pipe(res)
        //   const readstream = gfs.createReadStream({ filename: file.filename });
        // readstream.pipe(res);
      }
      else{
        res.status(500).json({err: 'not an image'
        })
      }
    }) 
  })





 app.get('/', (req, res) => {
     res.send('you hit my site')
 })

 const port = process.env.PORT || 5001

 app.listen(port, () => console.log(`sever listening on port ${port}`))