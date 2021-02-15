const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const path = require('path')
const fs = require('fs')
const Author = require('../models/author')
const uploadPath = path.join('public', Book.coverImageBasePath)

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

const multer = require('multer')
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})

router.get('/', async (req, res) => {
    let query = Book.find()
    if(req.query.title != null && req.query.title != ''){
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }

    if(req.query.publishedBefore != null && req.query.publishedBefore != ''){
        query = query.lte('publishDate', req.query.publishedBefore)
    }

    if(req.query.publishedAfter != null && req.query.publishedAfter != ''){
        query = query.gte('publishDate', req.query.publishedAfter)
    }

    try {
        const books = await query.exec()
        res.render('books/index', {
            books: books,
            searchOptions: req.query
        })            
    } catch (error) {
        res.redirect('/')
    }
})

router.get('/new', async (req, res) => {
    renderNewPage(res, new Book())
})

router.post('/', upload.single('cover'), async (req, res) => {
    const filename = req.file != null ? req.file.filename : null
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description,
        coverImageName: filename
    })
    try {
        const newBook = await book.save()
        //res.redirect()
        res.redirect('books')
    } catch (error) {
        if(book.coverImageName != null) {
            removeBookCover(book.coverImageName)
        }
        renderNewPage(res, book, true)
    }
})

async function renderNewPage(res, book, hasError=false) {
    try {
        const authors = await Author.find({})
        const params = {
            authors: authors,
            book: book
        }
        if(hasError) params.errorMessage = 'Error creating book'
        res.render('books/new', params)
    } catch {
        res.redirect('/books')
    }
}

function removeBookCover(filename){
    fs.unlink(path.join(uploadPath + filename), error =>{
        if(error) console.error(err)
    })
}

module.exports = router