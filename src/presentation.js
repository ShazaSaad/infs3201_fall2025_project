const fs = require('fs/promises')
const prompt = require('prompt-sync')()
const business = require('./business')

/**
 * Handles user login by prompting for username and password.
 * Continuously asks for credentials until valid ones are entered.
 *
 * @async
 * @function login
 * @returns {Promise<Object>} The authenticated user object containing user data.
 */
async function login() {
    console.log("=== Login ===")
    while (true) {
        let username = prompt("Username: ").trim()
        let password = prompt("Password: ").trim()

        let result = await business.authenticateUser(username, password)
        if (result.success) {
            console.log(`Welcome, ${result.data.username}!`)
            return result.data
        } else {
            console.log(result.error + " Please try again.\n")
        }
    }
}

/**
 * The main entry point for the application.
 * Provides a menu-driven interface for users to:
 *  - Find photos
 *  - Update photo details
 *  - List photos in an album
 *  - Tag photos
 *  - Exit the program
 *
 * Runs continuously until the user chooses to exit.
 *
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
    let user = await login()

    while (true) {
        console.log("1. Find Photo")
        console.log("2. Update Photo Details")
        console.log("3. Album Photo List")
        console.log("4. Tag Photo")
        console.log("5. Exit")

        let choice = prompt("Your selection> ")

        if (choice == '1') {
            let photoId = parseInt(prompt("Photo ID? "))
            let userPhotos = await business.getPhotosByUser(user.id)

            let found = null
            for (let i = 0; i < userPhotos.length; i++) {
                if (userPhotos[i].id === photoId) {
                    found = userPhotos[i]
                    break
                }
            }

            if (!found) {
                console.log("Photo not found or not yours.")
            } else {
                console.log(`Filename: ${found.filename}`)
                console.log(`Title: ${found.title}`)
                console.log(`Date: ${new Date(found.date).toLocaleDateString()}`)
                console.log(`Tags: ${found.tags.join(', ')}`)
            }

        } else if (choice == '2') {
            let photoId = parseInt(prompt("Photo ID? "))
            let result = await business.updatePhotoDetails(photoId, user.id, null, null)

            if (result.error === "Photo not found.") {
                console.log("Photo not found.")
            } else if (result.error === "Access denied.") {
                console.log("You do not own this photo.")
            } else {
                console.log("Press enter to reuse existing value.")
                let newTitle = prompt(`New title [${result.data.title}]: `)
                let newDesc = prompt(`New description [${result.data.description}]: `)

                let finalResult = await business.updatePhotoDetails(photoId, user.id, newTitle, newDesc)
                console.log("Photo updated.")
            }
        }
        else if (choice == '3') {
            let albumName = prompt("What is the name of the album? ")
            let result = await business.albumPhotoList(albumName, user.id)

            if (result.error) {
                console.log(result.error)
            } else {
                console.log("filename , resolution , tags")
                for (let i = 0; i < result.data.length; i++) {
                    let photo = result.data[i]
                    let tags = ""
                    if (photo.tags && photo.tags.length > 0) {
                        for (let j = 0; j < photo.tags.length; j++) {
                            tags += photo.tags[j]
                            if (j < photo.tags.length - 1) {
                                tags += " : "
                            }
                        }
                    }
                    console.log(photo.filename + " , " + photo.resolution + " , " + tags)
                }
            }

        } else if (choice == '4') {
            let photoId = parseInt(prompt("What photo ID to tag? "))
            let newTag = prompt("New tag: ")

            let result = await business.addPhotoTag(photoId, user.id, newTag)
            if (result.error) {
                console.log(result.error)
            } else {
                console.log("Tag added!")
            }

        } else if (choice == '5') {
            break
        } else {
            console.log("Invalid choice, please try again.")
        }
    }
}

main()
