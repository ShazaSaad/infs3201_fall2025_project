const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { engine } = require('express-handlebars')
const fileUpload = require('express-fileupload')
const path = require('path')
const business = require('./src/business')
const { error } = require('console')


// Create Express app
const app = express()
app.use(cookieParser())
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

// serve uploaded image file from upload form page
// using temporary location and then moved to the /puplic/photos
// to avoid overwellming heap
/*
app.use(fileUpload({
  useTempFiles: true, // carry them to disk instead of RAM
  tempFileDir: path.join(__dirname, 'public', 'temp'),
  limits:{fileSize: 10* 1024* 1024}, //limit of uploading file with more than 5MB
  createParentPath: true
}))
  */
app.use(fileUpload())
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
/**
 * Handles log in requests of users
 * redirects existed users to /main page
 * else redirect them to same page with and error
 */
app.post('/', async (req, res) => {
  let username = req.body.username
  let password = req.body.password
  // validateUser if true returns object {status: true ,userId: user.userID}
  let valid = await business.validateUser(username, password)
  if (valid.status) {
    let sessionKey = await business.startSession({ username: username, userId: valid.userId })
    res.cookie('sessionKey', sessionKey, { httpOnly: true })
    res.redirect('/main')
    return
  }
  res.redirect('/?message=Invalid Credentials')
})

/**
 * Renders the registration page to admit new users
 */
app.get('/register', async (req, res) => {
  let message = req.query.message
  res.render('registration', { layout: undefined, message: message })
})

/**
 * Handles the new registered user entries(username, email, password, confirmed password)
 * regitering new user to users collection if all entries correct
 * error message if entries not valid
 */
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
    const sessionkey = req.cookies.sessionKey
    const sessionData = await business.getSessionData(sessionkey)
    const result = await business.albumPhotoListByowner(albumName, sessionData.userId)

    if (result.error) {
      res.status(404).render('error', { message: result.error, layout: false })
    } else {
      res.render('albums', {
        albumName,
        photos: result.data,
        error: req.query.error,
        success: req.query.success,
        layout: false
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).render('error', { message: 'Failed to load album.', layout: false })
  }
})


app.post("/albums/:name/upload", async (req, res) => {
  let albumName = req.params.name
  let sessionKey = req.cookies.sessionKey
  let sessionData = await business.getSessionData(sessionKey)
  const result = await business.albumPhotoListByowner(albumName, sessionData.userId)
  let owner = sessionData.userId
  //check if user logged in
  if (!sessionData) {
    res.status(403).render('error', { message: "Not permitted to upload.. please login!", layout: false })
  }
  if (!req.files || !req.files.uploaded_photo) {
    return res.status(400).redirect(`/albums/${albumName}?error=No file uploaded`)
  }
  const uploaded = req.files.uploaded_photo
  //filtering image type before insertion
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']


  if (!allowedTypes.includes(uploaded.mimetype)) {//checking file type and generates 
    //upload new photo to folder photos as temporary location
    return res.status(400).redirect(`/albums/${albumName}?error=invalid file type`)
  }
  // the temporary file
  //console.log("Temporary file path on disk: ", uploaded.tempFilePath)

  let filename = Date.now() + "_" + path.basename(uploaded.name)
  let finalPath = path.join(__dirname, 'Public', 'photos', filename)
  try {
    await uploaded.mv(finalPath)
    let addition_process = await business.addPhoto(sessionData.userId, filename, albumName)

    if (addition_process.status) {

      let res = await business.albumPhotoListByowner(albumName, owner)
      return res.status(302).redirect(`/albums/${albumName}?success=successfully uploaded`)
    } else {
      return res.status(400).redirect(`/albums/${albumName}?error=failed to save photo info`)
    }
  } catch (err) {
    console.error(err)
    return res.redirect(`/albums/${albumName}?error=Upload failed`)
  }

})

/**
 * Renders the details page for a specific photo.  
 * GET /photos/:id
 */
app.get('/photos/:id', async (req, res) => {
  const photoId = req.params.id
  const photo = await business.getPhotoDetails(photoId)
  const sessionId = req.cookies.sessionKey
  const sessionData = await business.getSessionData(sessionId)
  if (!photo) {
    res.status(404).render('error', { message: 'Photo not found.', layout: false })
  } else {
    const comments = await business.getComments(photoId)
    const username = sessionData ? sessionData.username : undefined
    const isOwner = sessionData && sessionData.userId && Number(sessionData.userId) === Number(photo.owner)
    res.render('photos', { isOwner, photo, comments, username, layout: false })
  }
})

/**
 * Handles new comments validations
 * adding comments and redirect to Photo details page
 * redirect to error 
 */
app.post('/photos/:id/comment', async (req, res) => {
  const photoId = req.params.id
  const text = req.body.text.trim()
  const sessionKey = req.cookies.sessionKey

  const sessionData = await business.getSessionData(sessionKey)
  const username = sessionData ? sessionData.username : null
  const userId = sessionData ? sessionData.userId : null

  if (!username) {
    return res.redirect(`/photos/${photoId}?message=You must be logged in to comment`)
  }

  if (!text) {
    return res.redirect(`/photos/${photoId}?message=Comment cannot be empty`)
  }

  await business.addComment(photoId, username, text)
  const photo = await business.getPhotoDetails(photoId)

  if (photo && Number(photo.owner) !== Number(userId)) {
    await business.addNotification(
      photo.owner,
      photoId,
      `${username} commented on your photo`
    )
  }
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

/**
 * Handles editing photos entries validation (title ,visibility, description)
 * edit photo using updated function to updated photo data
 * redirect to photo details page with updated fields.
 */
app.post('/photos/:id/edit', async (req, res) => {
  const photoId = req.params.id
  const sessionKey = req.cookies.sessionKey
  const { title, description } = req.body
  const phototype = req.body.visibility
  await business.updatePhotoDetails(photoId, title, description, phototype, sessionKey)
  res.redirect(`/photos/${photoId}`)
})

/**
 * Deletes the session and redirects the user to login page.  
 * GET /logout
 */
app.get('/logout', async (req, res) => {
  const sessId = req.cookies.sessionKey

  if (sessId) {
    // Deleting the session from the database and removing the cookie
    await business.deleteSession(sessId)
    res.clearCookie('sessionKey')
  }

  // Redirecting the user to the login page
  res.redirect('/')
})

app.get('/search', async (req, res) => {
  const q = req.query.q
  const sessionData = await business.getSessionData(req.cookies.sessionKey)
  const userId = sessionData ? sessionData.userId : null
  const results = await business.searchPhotos(q, userId)
  res.render('search', { query: q, results, layout: false })
})

app.get('/notifications', async (req, res) => {
  const sessionData = await business.getSessionData(req.cookies.sessionKey)
  if (!sessionData) {
    return res.redirect('/?message=Please log in first')
  }

  const notifications = await business.getNotifications(sessionData.userId)
  res.render('notifications', { notifications, layout: false })
})


// Start the server
app.listen(8000, () => console.log('Server running'))
