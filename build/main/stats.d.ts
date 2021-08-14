import { Meta } from './interfaces';
export declare class Stats {
    private $meta;
    /**
     * The number of rows in the parsed data
     */
    originalRows: number;
    /**
     * The number of rows that were submitted
     */
    acceptedRows: number | null;
    /**
     * The number of columns in the parsed data
     */
    originalColumns: number | null;
    /**
     * The number of columns submitted
     */
    matchedColumns: number | null;
    constructor(meta: Meta);
}
