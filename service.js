const { ServiceWrapper, AmqpManager, Middlewares } = require("@molfar/service-chassis")
let service = new ServiceWrapper({
 	
    config: null,
    
    async onConfigure(config, resolve){
        
        const { execute } = require("./src/fasttext")(config)

        this.config = config


        this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

       await this.consumer.use([
           Middlewares.Json.parse,
           Middlewares.Schema.validator(this.config.service.consume.message),
           Middlewares.Error.Log,
           Middlewares.Error.BreakChain,

           async (err, msg, next) => {
               let m = msg.content
               let message = m.service.scraper.message.text // need to undestand

               console.log("execute", message)
                  
               let res = await execute(message)
               if(res.response.status){
                m['service']['fasttext'] = res.response.data;
               }else{
                m['service']['fasttext'] = {message: res.response.message}
               }
               this.publisher.send(m)
               msg.ack()
           }

       ])



       this.publisher = await AmqpManager.createPublisher(this.config.service.produce)
       
       await this.publisher.use( Middlewares.Json.stringify )

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