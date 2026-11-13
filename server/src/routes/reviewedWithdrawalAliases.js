// Keep the legacy list contract; new review actions delegate to the #57 router.
const reviewed=require('./reviewedWithdrawalRoutes');
module.exports=(req,res,next)=>req.method==='POST'&&/^\/[^/]+\/(approve|reject|verify)\/?$/.test(req.path)?reviewed(req,res,next):next();
