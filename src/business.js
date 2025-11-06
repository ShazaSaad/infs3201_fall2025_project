const persistence = require('./persistence')

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
 * @return {Promise<Object>} An object indicating success or error.
 */
async function updatePhotoDetails(photoId, newTitle, newDescription) {
  const photos = await persistence.loadPhotos()

  for (let i = 0; i < photos.length; i++) {
    if (photos[i]._id == photoId || photos[i].id == photoId) {
      if (newTitle) photos[i].title = newTitle
      if (newDescription) photos[i].description = newDescription

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
async function albumPhotoList(albumName) {
  const albums = await persistence.loadAlbums()
  const photos = await persistence.loadPhotos()

  let album = null
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
        foundPhotos.push(photo)
        break
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


module.exports = {
  listAlbums,
  updatePhotoDetails,
  albumPhotoList,
  getPhotoDetails
}
