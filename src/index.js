'use strict';

const linkCheck = require('link-check');
const markdownLinkExtractor = require('markdown-link-extractor');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const extractLinks = (path) => {
  const markdown = fs.readFileSync(path).toString();
  return markdownLinkExtractor(markdown);
}

const exploreLinks = (file, linksArray, validate = false) => {
  return new Promise((resolve, reject) => {
    if (validate) {
      const links = Promise.all(linksArray.map(async link => {
        return new Promise((resolve, reject) => {
          linkCheck(link, (err, {link: href, text, statusCode, status}) => {
            if (err) {
              console.log(err)
              reject()
            }
            resolve({ href, file, text, statusCode, status })
          })
        })
      }))
      resolve(links)
    }
    const links = linksArray.map(link => {
      return { href: link, file }
    })
    resolve(links)
  })
}

const markdownLinks = (nodePath, validate = false) => {
  const dirTemp = fs.realpathSync(nodePath)
  const stats = fs.statSync(dirTemp);
  return new Promise((resolve, reject) => {
    if (stats.isDirectory()) {
      const files = glob.sync(`${nodePath}/**/*.md`)
      const markdownInfo = Promise.all(files.map(async file => {
        const pathFile = path.join(__dirname, `../${file}`) // Reading file
        const links = extractLinks(pathFile); // Getting links
        const linksInfo = await exploreLinks(pathFile, links, validate)
        return { 
          file, 
          links: linksInfo,
          totalOfLinks: linksInfo.length
        }; // Getting info links
      }));
      resolve(markdownInfo);
    }

    const pathFile = path.join(__dirname, `../${nodePath}`) // Reading file
    const links = extractLinks(pathFile); // Getting links
    exploreLinks(pathFile, links, validate).then(response => {
      resolve({ 
        file: pathFile, 
        links: response,
        totalOfLinks: response.length
      })
    })
    
  })
}

markdownLinks('posts', true).then(response => {
  console.log(response)
});