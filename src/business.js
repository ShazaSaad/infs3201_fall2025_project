const persistence = require('./persistence')
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
 * @return {Promise<Object>} An object indicating success or error.
 */
async function updatePhotoDetails(photoId, newTitle, newDescription, newVisibility) {
  const photos = await persistence.loadPhotos()

  for (let i = 0; i < photos.length; i++) {
    if (photos[i]._id == photoId || photos[i].id == photoId) {
      if (newTitle) photos[i].title = newTitle
      if (newDescription) photos[i].description = newDescription
      if (newVisibility.trim().toLowerCase() === 'public' || newVisibility.trim().toLowerCase() === 'private') photo[i].visibility = newVisibility.trim().toLowerCase()

      await persistence.savePhotos(photos)
      return { success: true, data: photos[i] }
    }
  }

  return { error: "Photo not found." }
}

/**
  * Retrieves a list of photos in a specified album.
  * @param {string} albumName - The name of the album.
  * @return {Promise<Object>} An object containing either the list of photos or an error message.
  */
async function albumPhotoList(albumName, ownerID) {
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
    const photo = photos[i]
    for (let j = 0; j < photo.albums.length; j++) {
      if (photo.albums[j] == album._id || photo.albums[j] == album.id) {
        if (photo.visibility == "public" || Number(photo.owner) === Number(ownerID)) {
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

async function validateUser(username, password) {
  return await persistence.validateUser(username, password)
}

async function register(email, username, password) {
  let userInfo = {
    username: username,
    password: password,
    email: email
  }
  return await persistence.register(userInfo)
}

async function startSession(data) {
  let uuid = crypto.randomUUID()
  let expiry = new Date(Date.now() + 5 * 60 * 1000)
  await persistence.saveSession(uuid, expiry.toISOString(), data)
  return uuid
}

async function getSessionData(key) {
  if (!key) {
    return undefined
  }
  const session = await persistence.getSessionData(key)
  if (!session) {
    return undefined
  }
  const expiryDate = new Date(session.expiry)
  if (Date.now() > expiryDate.getTime()) {
    return session.data
  } else {
    await persistence.deleteSession(key)
    return undefined
  }
}

async function deleteSession(key) {
  await persistence.deleteSession(key)
}

async function addComment(photoId, userID, text) {
  if (!text || !text.trim()) {
    return { error: 'Comment text cannot be empty.' }
  }
  const comment = {
    photoId: photoId,
    userID: userID,
    text: text.trim(),
    timestamp: new Date().toISOString()
  }
  await persistence.saveComment(comment)
  return { success: true }
}

async function getComments(photoId) {
  const comments = await persistence.loadComments(photoId)
  return comments
}
module.exports = {
  listAlbums,
  updatePhotoDetails,
  albumPhotoList,
  getPhotoDetails,
  validateUser,
  register,
  addComment,
  getComments,
  startSession,
  getSessionData,
  deleteSession
}
