import { EventEmitter } from 'eventemitter3';
import { CustomerObject, FieldHookCallback, IDataHookResponse, ISettings, IVirtualFieldOptions, LoadOptionsObject, StepHookCallback, StepHooks } from './interfaces';
import { Results } from './results';
export declare class FlatfileImporter extends EventEmitter {
    static Promise: PromiseConstructor;
    private static MOUNT_URL;
    private static UserBulkInitHook?;
    /**
     * Promise that resolves when the handshake is completed between Flatfile.io and the adapter
     */
    $ready: Promise<any>;
    private apiKey;
    private options;
    private customer?;
    private uuid;
    private handshake;
    private $resolver;
    private $rejecter;
    private $networkErrorCallback?;
    private $beforeFetchCallback?;
    private $interactionEventCallback?;
    private $recordHook?;
    private $fieldHooks;
    private $stepHooks;
    constructor(apiKey: string, options: ISettings, customer?: CustomerObject);
    /**
     * This will by default always be `https://www.flatfile.io/importer/:key` unless you are
     * an enterprise customer that is self-hosting the application. In which case, this
     * will be the URL of your enterprise installd Flatfile importer index page
     */
    static setMountUrl(url: string): void;
    /**
     * This allows you to opt into or out of specific versions of the Flatfile SDK
     */
    static setVersion(version: 1 | 2): void;
    static setUserBulkInitHook(cb: (rows: any, mode: any) => {} | undefined): void;
    /**
     * Call open() to activate the importer overlay dialog.
     */
    open(options?: {}): void;
    /**
     * Use load() when you want a promise returned. This is necessary if you want to use
     * async/await for an es6 implementation
     * @deprecated
     */
    load(): Promise<Array<Object>>;
    /**
     * Use requestDataFromUser() when you want a promise returned. This is necessary if you want to use
     * async/await for an es6 implementation
     */
    requestDataFromUser(options?: LoadOptionsObject): Promise<Results>;
    /**
     * This will display a progress indicator inside the importer if you anticipate that handling
     * the output of the importer may take some time.
     */
    displayLoader(msg?: string): void;
    /**
     * This will display a dialog inside of the importer with an error icon and the message you
     * pass. The user will be able to acknowledge the error and be returned to the import data
     * spreadsheet to ideally fix any issues or attempt submitting again.
     * @deprecated
     */
    displayError(msg?: string): void;
    /**
     * This will display a dialog inside of the importer with an error icon and the message you
     * pass. The user will be able to acknowledge the error and be returned to the import data
     * spreadsheet to ideally fix any issues or attempt submitting again.
     *
     * @param corrections - allows user to do server-side validation and provide error / warning
     * messages or value overrides
     */
    requestCorrectionsFromUser(msg?: string, corrections?: IDataHookResponse[]): Promise<Results>;
    /**
     * This will display a dialog inside of the importer with a success icon and the message you
     * pass.
     *
     * @return Promise that will be resolved when user closes the dialog.
     */
    displaySuccess(msg?: string): Promise<void>;
    /**
     * Set the customer information for this import
     */
    setCustomer(customer: CustomerObject): void;
    /**
     * Set the language for the Portal
     */
    setLanguage(lang: string): void;
    addVirtualField(field: ISettings['fields'][0], options?: IVirtualFieldOptions): void;
    /**
     * Set the customer information for this import
     */
    registerRecordHook(callback: FlatfileImporter['$recordHook']): void;
    registerNetworkErrorCallback(callback: FlatfileImporter['$networkErrorCallback']): void;
    registerBeforeFetchCallback(callback: FlatfileImporter['$beforeFetchCallback']): void;
    registerInteractionEventCallback(callback: FlatfileImporter['$interactionEventCallback']): void;
    registerFieldHook(field: string, cb: FieldHookCallback): void;
    registerStepHook<T extends keyof StepHooks>(step: T, callback: StepHookCallback<T>): void;
    /**
     * Call close() from the parent window in order to hide the importer. You can do this after
     * handling the import callback so your users don't have to click the confirmation button
     */
    close(): void;
    private handleClose;
    private initialize;
    private $generateUuid;
    private responsePromise;
}
