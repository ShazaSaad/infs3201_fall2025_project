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
  let message = req.query.message

  res.render('login', {
    layout: undefined,
    message: message
  })
})
let ownerId =0

app.post('/', async (req, res) => {
  let username = req.body.username
  let password = req.body.password
  // validateUser if true returns object {status: true ,userId: user.userID}
  let valid = await business.validateUser(username, password)
  ownerId= valid.userId
  if (valid.status) {
    res.redirect('/main')
    return
  }
  res.redirect('/?message=Invalid Credentials')
})

app.get('/register', async (req, res) => {
  let message = req.query.message
  res.render('registration', { layout: undefined, message: message })
})

app.post('/register', async (req, res) => {
  let email = req.body.email
  let username = req.body.username
  let password = req.body.password
  let confPassword = req.body.confPassword

  if (password !== confPassword) {
    res.redirect('/register?message=Passwords do not match')
    return
  }

  await business.register(email, username, password)
  // there is no /login route in this app; redirect to the root login page
  res.redirect('/?message=You were successfully registered')
})

/**
 * Renders the homepage with a list of albums.  
 * GET /
 */
app.get('/main', async (req, res) => {
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
    const result = await business.albumPhotoList(albumName, ownerId)

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
    const comments = await business.getComments(photoId)
    res.render('photos', { photo, comments, layout: false })
  }
})

app.post('/photos/:id/comment', async (req, res) => {
  const photoId = req.params.id
  const { userID, content } = req.body
  if (!userID || !content) {
    res.redirect(`/photos/${photoId}?message=Username and content are required`)
    return
  }
  await business.addComment(photoId, userID, content)
  res.redirect(`/photos/${photoId}`)
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
  const phototype = req.body.visibility
  await business.updatePhotoDetails(photoId, title, description, phototype)
  res.redirect(`/photos/${photoId}`)
})

// Start the server
app.listen(8000, () => console.log('Server running'))
