import { FindTitle, FindMainText, SayHello } from "./domworker";
import { ActiveHtml, ReducedHtml, ReadabilityHtml } from "./html-content";

function findData(): any {
    return {
        title: FindTitle(),
        mainText: FindMainText(),
        message: SayHello(),
        html: ActiveHtml(),
        reducedHtml: ReducedHtml(),
        readabilityHtml: ReadabilityHtml()
    };
}

export default findData();
