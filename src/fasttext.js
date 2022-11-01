const _ = require('lodash')
const path = require("path")
const FastText = require('fasttext.js')

let fasttext
let config
let fasttextCommand

let methodMaps = {
	"print-word-vectors": {
		load:"loadPWV",
		query:"printWordVectors",
		options: {
			printWordVectors:{
				normalize: true
			}
		}	
	 },
	 "print-sentence-vectors": {
		load:"loadPSV",
		query:"printSentenceVectors",
		options: {
			printSentenceVectors:{
					normalize: true
			}
		}	
	 }
}

const execute = async message => {
    if(fasttext){
		let result = await fasttext[methodMaps[fasttextCommand].query](message)
		return  {
            response:{
                data: result,
                status:"success"
            }
        }
	} else {
        return  {
            response:{
				message:"error in initilisation fasttext",
				status:"error"
			}	
        }
	}
}

let initialize = async () => {
        fasttextCommand = config.service.fasttextCommand
		let loadModel= path.resolve(config.service.fasttext.models.path) 
		let options = _.extend({loadModel}, methodMaps[fasttextCommand].options)
		
		fasttext = new FastText(options);
		
		console.log(`Load model ${JSON.stringify(options, null," ")} by ${methodMaps[fasttextCommand].load} method`)

		return await fasttext[methodMaps[fasttextCommand].load]()
}


module.exports =  conf => {
	config = conf
    initialize
	return {
		execute
	}	 
}