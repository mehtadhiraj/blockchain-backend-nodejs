module.exports.home = function(req, res){
    try {
        res.json({
            status : 202,
            message : "Welcome to new method of payment."
        })    
    } catch (error) {
        res.json({
            error : error
        })
    }
    
}

module.exports.login = function(req, res){
    try {
        res.json({
            message: "Successfully logedin"
        })  
    } catch (error) {
        res.json({
            error: error
        })
    }
}
