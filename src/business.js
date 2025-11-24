const persistence = require('./persistence')
const  { sendMail } = require('./notifications')
const crypto = require('crypto')
/**
 * Retrieves a list of all albums.
 * @return {Promise<Array>} An array of album objects.
 */
async function listAlbums() {
  const albums = await persistence.loadAlbums()
  return albums
}


/**
 * Updates the details of a photo.
 * @param {string} photoId - The ID of the photo to update.
 * @param {string} newTitle - The new title for the photo.
 * @param {string} newDescription - The new description for the photo.
 * @param {string} visibility - to set visibility to public or private
 * @param {Number} sessionKey - to enable photo owner only to make changes
 * @return {Promise<Object>} An object indicating success or error.
 */
async function updatePhotoDetails(photoId, newTitle, newDescription, newVisibility, sessionKey) {
  const photos = await persistence.loadPhotos()
  let sessionData = await getSessionData(sessionKey)
  let userId = sessionData.userId
  for (let i = 0; i < photos.length; i++) {
    if (photos[i]._id == photoId && (sessionData && photos[i].owner === userId)) {
      if (newTitle) photos[i].title = newTitle
      if (newDescription) photos[i].description = newDescription
      if (newVisibility.trim().toLowerCase() === 'public' || newVisibility.trim().toLowerCase() === 'private') photos[i].visibitlity = newVisibility.trim().toLowerCase()
      await persistence.savePhotos(photos)
      return { success: true, data: photos[i] }
    }
  }

  return { error: "Photo not found." }
}

/**
  * Retrieves a list of photos in a specified album.
  * @param {string} albumName - The name of the album.
  * @param {Number } ownerID - to enable access for eligibile users to private photo+ public ones
  * @return {Promise<Object>} An object containing either the list of photos or an error message.
  */

async function albumPhotoListByowner(albumName, ownerID) {
  const albums = await persistence.loadAlbums()
  const photos = await persistence.loadPhotos()

  let album;
  for (let i = 0; i < albums.length; i++) {
    if (albums[i].name.toLowerCase() === albumName.toLowerCase()) {
      album = albums[i]
      break
    }
  }

  if (!album) {
    return { error: `Album "${albumName}" not found.` }
  }

  let foundPhotos = []
  for (let i = 0; i < photos.length; i++) {
    let photo = photos[i]
    for (let j = 0; j < photo.albums.length; j++) {
      if (photo.albums[j] == album._id || photo.albums[j] == album.id) {
        if (photo.visibitlity == "public" || Number(photo.owner) === Number(ownerID)) {
          foundPhotos.push(photo)
          break
        }

      }
    }
  }

  return { success: true, data: foundPhotos, album }
}




/**
 * Retrieves the details of a specific photo by its ID.
 * @param {string} photoId - The ID of the photo.
 * @return {Promise<Object|null>} The photo object if found, otherwise null.
 */
async function getPhotoDetails(photoId) {
  const photos = await persistence.loadPhotos()
  for (let i = 0; i < photos.length; i++) {
    const currentId = photos[i]._id?.toString() || photos[i].id?.toString()
    if (currentId === photoId) {
      return photos[i]
    }
  }
  return null
}
/**
 * to validate users according to their username and password to access photos
 * @param {String} username - for validation
 * @param {String} password - for validation
 * @returns {Promise<Object> || false} function validateUser() that returns {status: true, userID: user.userId} || false
 */
async function validateUser(username, password) {
  return await persistence.validateUser(username, password)
}

/**
 * to add new user to users using params bellow
 * @param {String} email 
 * @param {String} username 
 * @param {String} password 
 * @returns {Object} error object or successfull registeration object
 */
async function register(email, username, password) {
  let userInfo = {
    username: username,
    password: password,
    email: email
  }
  return await persistence.register(userInfo)
}


/**
 * to start user session using Object that defines user 
 * @param {Object} data - contains username and userId
 * @returns {String} sessionId 
 */
async function startSession(data) {
  let uuid = crypto.randomUUID()
  let expiry = new Date(Date.now() + 5 * 60 * 1000)
  await persistence.saveSession(uuid, expiry.toISOString(), data)
  return uuid
}

/**
 * to fetch session data from session using session Id
 * @param {String} key -session id
 * @returns {Object} -Session Data object that contains username and userID
 */
async function getSessionData(key) {
  if (!key) return undefined

  const session = await persistence.getSessionData(key)
  if (!session) return undefined

  const expiryDate = new Date(session.expiry)

  if (Date.now() > expiryDate.getTime()) {
    await persistence.deleteSession(key)
    return undefined
  }

  return session.data
}

/**
 * Deletes session Object from sessions collection 
 * @param {String} key session Id for specific session
 */
async function deleteSession(key) {
  await persistence.deleteSession(key)
}
/**
 * Add users comments to comments collections using beloow params
 * @param {Number} photoId - to identify photo commented to
 * @param {String} username -to identify which user commenting
 * @param {String} text - comment text to be passed to photos and comments collections
 * @returns {Object} - error object identifies error adding comment|| success comment addition object
 */
async function addComment(photoId, username, text) {
  if (!text || !text.trim()) {
    return { error: 'Comment text cannot be empty.' }
  }

  // Save comment
  await persistence.saveComment({
    photoId,
    username,
    text: text.trim(),
    timestamp: new Date()
  })

  // Load photo
  const photo = await persistence.loadPhotos()
    .then(photos => photos.find(p => p._id.toString() === photoId))

  if (!photo) return { success: true }

  // Get owner info
  const owner = await persistence.getUserById(photo.owner)

  if (owner && owner.email) {
    sendMail(
      owner.email,
      "New Comment on Your Photo",
      `User ${username} commented:\n\n"${text}"`
    )
  }
}

/**
 * To get comment in a formated fromat with timestamps
 * @param {Number} photoId -
 * @returns {object} formattedComments - text with the time 
 */
async function getComments(photoId) {
  const comments = await persistence.loadComments(photoId)
  let formattedComments = []

  for (let i = 0; i < comments.length; i++) {
    let comment = comments[i]
    comment.timestamp = new Date(comment.timestamp).toLocaleString()
    formattedComments.push(comment)
  }

  return formattedComments
}

async function searchPhotos(query, userId) {
  const photos = await persistence.loadPhotos()
  const term = query.trim().toLowerCase()
  let results = []
  for (let photo of photos) {
    const matches= 
    (photo.title && photo.title.toLowerCase().includes(term)) ||
    (photo.description && photo.description.toLowerCase().includes(term)) ||
    (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(term)))

    if (!matches) {
      continue
    }
    if (photo.visibitlity === 'public' || Number(photo.owner) === Number(userId)) {
      results.push(photo)
    }
  }
  return results
}

module.exports = {
  listAlbums,
  updatePhotoDetails,
  albumPhotoListByowner,
  getPhotoDetails,
  validateUser,
  register,
  addComment,
  getComments,
  startSession,
  getSessionData,
  deleteSession,
  searchPhotos
}
