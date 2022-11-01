module.exports = {

	service:{
		name: process.env.SERVICE_NAME || "service-fasttext",
		lang: process.env.FASTTEXT_LANG || "uk",
		mode: process.env.NODE_ENV || "development",
        fasttextCommand: process.env.FASTTEXT_COMMAND || "print-sentence-vectors",
		fasttext:{
			
			models:{
                
                path: process.env.MODEL_PATH || "./model/cc.uk.25.bin"

			}	
		}
	}
}