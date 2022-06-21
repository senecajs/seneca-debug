export default class Intern {
    Seneca: any;
    cmdSpec: any;
    map: any;
    trace: {
        children: [];
        meta: {
            pattern: 'top:true';
        };
    };
    constructor(Seneca: any);
    handlePrintTree(): void;
    printTree(): void;
}
