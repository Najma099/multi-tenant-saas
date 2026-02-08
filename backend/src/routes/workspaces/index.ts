//     /workspace
//      /GET(get all the workspace)
 //      /post(add new workspace)


 ///workspace/:workspaceid
 //     /get(get all the pages | get all the member of the workspace)
 //     /post(add new pages)
 //     /patch(fix the name of the particular workspace)
 //.    / delete(delete the particulular workspace)
 //. 


// workspace/:workspaceid/user
//.     post(add user into the workspace)
//.     get(to see if the particular user is part of the above workspace)
//      delete(the prsn from the above workspace)


import { Router } from 'express';
import getAllWorkspaceRouter from './workspace.route';

const router = Router();
router.use('/', getAllWorkspaceRouter);

export default router;