const { MongoClient } = require('mongodb')
const fs = require('fs')
const { timeStamp } = require('console')

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
    // console.log(photos)
    return photos
}

/**
 * Adding visibility field to each photo
 * and setting it to puplic as defualt
 */
/*
async function addingVisibilityParam() {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const photosCollection = db.collection('photos')
    await photosCollection.updateMany({} , 
        {$set : {visibitlity:"public"}})
}*/
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
/**
 * add session object to session collection
 * @param {String} sessionKey session ID
 * @param {Date} expiry - expiry date of user's current generated session
 * @param {Object} data - object contains info {username , userId}
 */
async function saveSession(sessionKey, expiry, data) {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const sessionsCollection = db.collection('sessions')
    await sessionsCollection.insertOne({
        sessionKey: sessionKey,
        expiry: expiry,
        data: data
    })
}
/**
 * find session data in sessions collection using sessionId if exists
 * @param {String} key - session identifier
 * @returns {Object || null} session Objects if exists || null > session object doesn't exists
 */
async function getSessionData(key) {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const sessionsCollection = db.collection('sessions')
    const session = await sessionsCollection.findOne({ sessionKey: key })
    if (session) {
        return session
    } else {
        return null
    }
}
/**
 * Deletes session Object using session id
 * @param {String} key 
 */
async function deleteSession(key) {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const sessionsCollection = db.collection('sessions')
    await sessionsCollection.deleteOne({ sessionKey: key })
}

/**
 * checks if username and password matches records in users collection
 * @param {String} username 
 * @param {String} password 
 * @returns {Object || false} valid user gets true status and  userId.else not valid>> false
 */
async function validateUser(username, password) {
    try {
        await connectDatabase()
        const db = client.db('infs3201_fall2025')
        const usersCollection = db.collection('users')
        const user = await usersCollection.findOne({ username, password })
        return user ? {status:true,userId: user.userID} : false
    } catch (err) {
        console.error('Error during login check', err)
        return false
    }
}
/**
 * adds new user to users collection using userInfo Object
 * @param {Object} userInfo contains (username , password, confirmed password, email)
 * @returns {Object} - returna error object if something went wrong|| success registration entries return object with true status and userId generated.
 */
async function register(userInfo) {
    try {
        await connectDatabase()
        const db = client.db('infs3201_fall2025')
        const usersCollection = db.collection('users')

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ username: userInfo.username })
        if (existingUser) {
            return { error: 'User already exists' }
        }

        // Assigning the user ID
        let userID = 1
        const lastUser = await usersCollection.find().sort({ userID: -1 }).limit(1).toArray()
        if (lastUser.length > 0) {
            userID = lastUser[0].userID + 1
        }

        userInfo.userID = userID

        // Inserting the new user into the database
        const result = await usersCollection.insertOne(userInfo)
        return { success: true, userId: result.insertedId }
    } catch (err) {
        console.error('Error during registration', err)
        return { error: 'Registration failed' }
    }
}

/**
 * add comment object to comments collection
 * @param {Object} comment - Object contains (photoId of photo, username of commenter,text comment, time of the comment )
 */
async function saveComment(comment) {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const commentsCollection = db.collection('comments')
    comment.timestamp = new Date()
    await commentsCollection.insertOne(comment)
}
/**
 * getting list of all comment objects of a specific photo using photo Id
 * @param {String} photoId 
 * @returns {Array<object>} - all comments of photo  
 */
async function loadComments(photoId) {
    await connectDatabase()
    const db = client.db('infs3201_fall2025')
    const commentsCollection = db.collection('comments')
    const comments = await commentsCollection.find({ photoId: photoId }).sort({timestamp: -1}).toArray()
    return comments
}

module.exports = {
    loadPhotos,
    savePhotos,
    loadAlbums,
    validateUser,
    register,
    getSessionData,
    saveSession,
    saveComment,
    loadComments,
    deleteSession,

}

