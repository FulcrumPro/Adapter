import { EndUserObject } from './interfaces';
export declare class EndUser {
    private $user;
    /**
     * The UUID referencing the user's record stored in Flatfile
     */
    id: string;
    /**
     * Your internal ID reference for this user (required)
     */
    userId: string;
    /**
     * The user's full name if you provided it
     */
    name: string | undefined;
    /**
     * The user's email if you provided it
     */
    email: string | undefined;
    /**
     * The company name the user is currently operating under
     */
    companyName: string | undefined;
    /**
     * The company name the user is currently operating under
     */
    companyId: string | undefined;
    constructor(meta: EndUserObject);
}
