const express = require('express')
const bodyParser = require('body-parser')
const { engine } = require('express-handlebars')
const path = require('path')
const business = require('./src/business')


// Create Express app
const app = express()

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }))

// Set up Handlebars as the view engine
app.engine('hbs', engine({
  extname: '.hbs',
  layout: undefined
}))
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')))

/**
 * Renders the homepage with a list of albums.  
 * GET /
 */
app.get('/', async (req, res) => {
  try {
    const albums = await business.listAlbums()
    res.render('index', { albums, layout: false })
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to load albums.' })
  }
})

/**
 * Renders a specific album page with its photos.  
 * GET /albums/:name
 */
app.get('/albums/:name', async (req, res) => {
  try {
    const albumName = req.params.name
    const result = await business.albumPhotoList(albumName)

    if (result.error) {
      res.status(404).render('error', { message: result.error, layout: false })
    } else {
      res.render('albums', {
        albumName,
        photos: result.data,
        layout: false
      })
    }
  } catch (error) {
    res.status(500).render('error', { message: 'Failed to load album.', layout: false })
  }
})

/**
 * Renders the details page for a specific photo.  
 * GET /photos/:id
 */
app.get('/photos/:id', async (req, res) => {
  const photoId = req.params.id
  const photo = await business.getPhotoDetails(photoId)
  if (!photo) {
    res.status(404).render('error', { message: 'Photo not found.', layout: false })
  } else {
    res.render('photos', { photo, layout: false })
  }
})

/**
 * Renders the edit page for a specific photo.  
 * GET /photos/:id/edit
 * POST /photos/:id/edit
 */
app.get('/photos/:id/edit', async (req, res) => {
  const photoId = req.params.id
  const photo = await business.getPhotoDetails(photoId)
  res.render('editphoto', { photo, layout: false })
})

app.post('/photos/:id/edit', async (req, res) => {
  const photoId = req.params.id
  const { title, description } = req.body
  let phototype =req.body.visibility
  await business.updatePhotoDetails(photoId, title, description ,phototype)
  res.redirect(`/photos/${photoId}`)
})



// Start the server
app.listen(8000, () => console.log('Server running'))
