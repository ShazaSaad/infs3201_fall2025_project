const { MongoClient } = require('mongodb')

let client = undefined

/**
 * Establishes a connection to the MongoDB database if not already connected.
 * This function initializes the MongoClient instance.
 * @return {Promise<void>}
 */
async function connectDatabase() {
    if (!client) {
        try {
            client = new MongoClient('mongodb+srv://60301815:60301815@60301815.kxwbpk3.mongodb.net/')
            await client.connect()
        } catch (err) {
            console.log("Error connecting to database", err)
        }
    }
}

/**
 * Loads all photos from the 'photos' collection in the database.
 * @return {Promise<Array>} An array of photo objects.
 */
async function loadPhotos() {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const photosCollection = db.collection('photos')
    const photos = await photosCollection.find({}).toArray()
    console.log(photos)
    return photos
}

/**
 * Adding visibility field to each photo
 * and setting it to puplic as defualt
 */
async function addingVisibilityParam() {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const photosCollection = db.collection('photos')
    await photosCollection.updateMany({} , 
        {$set : {visibitlity:"public"}})
}
//addingVisibilityParam()

/**
 * Saves the provided array of photos to the 'photos' collection in the database.
 * This function replaces all existing documents in the collection.
 * @param {Array} photos - An array of photo objects to be saved.
 * @return {Promise<void>}
 */
async function savePhotos(photos) {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const photosCollection = db.collection('photos')
    await photosCollection.deleteMany({})
    await photosCollection.insertMany(photos)
}

/**
 * Loads all albums from the 'albums' collection in the database.
 * @return {Promise<Array>} An array of album objects.
 */
async function loadAlbums() {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const albumsCollection = db.collection('albums')
    const albums = await albumsCollection.find({}).toArray()
    return albums
}

module.exports = {
    loadPhotos,
    savePhotos,
    loadAlbums
}