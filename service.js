const { ServiceWrapper, AmqpManager, Middlewares } = require("@molfar/service-chassis")
const { extend } = require("lodash")
const path = require("path")

let service = new ServiceWrapper({
 	
    config: null,
    
    async onConfigure(config, resolve){
        
        this.config = config

        const serviceSetup = this.config.service.fasttext? this.config.service.fasttext : require(path.resolve(__dirname,"./package.json")).fasttext

        const { execute, initialize } = require("./src/fasttext")(serviceSetup)

        await initialize()

        this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

       await this.consumer.use([
           Middlewares.Json.parse,
           Middlewares.Schema.validator(this.config.service.consume.message),
           Middlewares.Error.Log,
           Middlewares.Error.BreakChain,
           async (err, msg, next) => {
                console.log("CONSUME", msg.content)
                next()
           },
           Middlewares.Filter( msg =>  {
                if( msg.content.langDetector.language.locale != serviceSetup.lang) {
                    console.log(`IGNORE`, msg.content.langDetector.language.locale)
                    msg.ack()
                } else {
                    console.log(`ACCEPT`, msg.content.langDetector.language.locale)
                }
                return  msg.content.langDetector.language.locale == serviceSetup.lang
            }),

            async (err, msg, next) => {
                try {
                    let m = msg.content
                    
                    let res = await execute({text: m.scraper.message.text.replace(/\n+/g," ")})

                    m = extend({},m,{fasttext: res})
                    
                    this.publisher.send(m)
                    console.log("RECOGNIZE SENTIMENTS", res )
                    msg.ack()
                }    
                catch(e){
                    console.log("ERROR", e.toString())
                }    
            }
       ])

       this.publisher = await AmqpManager.createPublisher(this.config.service.produce)
       
       await this.publisher.use(    
            Middlewares.Schema.validator(this.config.service.produce.message),
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,
            Middlewares.Json.stringify )

       resolve({status: "configured"})
   
    },

   async onStart(data, resolve){
       this.consumer.start()
       resolve({status: "started"})	
    
    },

    async onStop(data, resolve){
       await this.consumer.close()
       await this.publisher.close()
       resolve({status: "stoped"})
   
   }

})


service.start()