import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    OnDestroy,
    ElementRef,
    NgZone
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { merge } from 'rxjs/observable/merge';
import { auditTime, delay } from 'rxjs/operators';

/** default search-box theme types */
export type SEARCH_TYPE = 'ico' | 'btn' | string;

/** default search-box is not suggest search */
export type IS_SUGGESTION = 'true' | 'false';

/** Time in ms to throttle the resize|scroll events by default. */
export const DEFAULT_DELAY_TIME = 50;

/** default search-box size types */
export type SIZE = 'long' | 'default' | 'short' | string;

@Component({
    selector: 'nb-search-box',
    templateUrl: './search-box.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    host: {
        'class': 'nb-widget nb-search-box',
        '[class.nb-search-box-disabled]': 'disabled',
        '[class.nb-search-box-ico]': 'type == "ico"',
        '[class.nb-search-box-btn]': 'type == "btn"',
        '(compositionstart)': '_compositionStart()',
        '(compositionend)': '_compositionEnd($event.target.value)'
    }
})
export class SearchBoxComponent implements OnInit, OnDestroy {

    /** search-box type: either 'ico' or 'btn' */
    @Input() type: SEARCH_TYPE = 'ico';

    /** search-box size, there four default size: 'default' */
    @Input() size: SIZE = 'default';

    /** Whether the search-box is suggest search: either true or false */
    @Input() isSuggestion: IS_SUGGESTION = 'false';

    /** search-box default placeholder */
    @Input() placeholder: string = '按关键词搜索';

    /** Whether the search-box is disabled  */
    @Input() disabled = false;

    /** search-box value */
    @Input() searchValue: string = '';

    /** search event */
    @Output() onSearch = new EventEmitter();

    /** clear search event */
    @Output() onClear = new EventEmitter();

    /** search-box suggest search value */
    @Input() suggestionValue: Array<string> = [];

    /** suggest search event */
    @Output() onSearchSuggestion = new EventEmitter();

    /** init suggest search region is not open */
    isOpen: boolean = false;

    /** Stream of viewport change|scroll events. */
    _change: Observable<Event>;

    /** Subscription to viewport resize|scroll events. */
    _resizeSubscription = Subscription.EMPTY;

    _composing = false;

    _sizeIpt = 'default';

    _sizeBtn = 'default';

    constructor(
        private el: ElementRef,
        private ngZone: NgZone
    ) {
        this._change = ngZone.runOutsideAngular(() => {
            return merge<Event>(fromEvent(window, 'resize'), fromEvent(window, 'scroll'));
        });
    }

    ngOnInit() {
        if (this.isSuggestion !== 'false') {
            this._resizeSubscription = this.change().subscribe(() => this.positionSuggestionLayer(this));
        }
        switch (this.size) {
            case 'small':
                this._sizeIpt = 'short-middle';
                this._sizeBtn = 'sm';
                break;
            case 'long':
                this._sizeIpt = 'long-high';
                this._sizeBtn = 'lg';
                break;
            default:
                this._sizeIpt = 'default';
                this._sizeBtn = 'default';
        }
        this.setClass();
    }

    ngOnDestroy() {
        this._resizeSubscription.unsubscribe();
    }

    setClass() {
        const nativeEl = this.el.nativeElement;
        nativeEl.className = this.getClassName(nativeEl.className);
    }

    getClassName(className: string) {
        return className + ' ' + `nb-search-box-size-${this.size || 'default'}`;
    }


    /**
     * Returns a stream that emits whenever the size of the viewport change|scroll.
     * @param throttle Time in milliseconds to throttle the stream.
     */
    change(throttleTime: number = DEFAULT_DELAY_TIME): Observable<Event> {
        return throttleTime > 0 ? this._change.pipe(auditTime(throttleTime)) : this._change;
    }

    /** position suggestion layer */
    positionSuggestionLayer(self) {
        let elLayer = self.el.nativeElement.getElementsByClassName('nb-search-box-suggestion-layer');
        if (elLayer.length) {
            /**
             * 156 = 36 + 110 + 10 
             * @docs-private
             */
            let pos = window.scrollY + window.innerHeight - self.el.nativeElement.offsetTop - 156 > 0
                ? 'bottom' : 'top';
            elLayer[0].className = 'nb-search-box-suggestion-layer' + ' ' + 'nb-search-box-suggestion-layer-' + pos;
        }
    }

    // 处理compositionstart事件
    _compositionStart(): void { 
        this._composing = true; 
    }
    
    // 处理compositionend事件
    _compositionEnd(): void {
        this._composing = false;
    }

    /** listen keyword input in search-box */
    onInputValue() {
        if (this.isSuggestion !== 'false' && this.searchValue && !this._composing) {
            this.positionSuggestionLayer(this);
            this.onSearchSuggestion.emit(this.searchValue);
            this.isOpen = true;
        } 
        if (!this.searchValue) {
            this.isOpen = false;
        }
    }

    /** 
     * clear keyword in search-box 
     * @param ipt
     * */
    clearSearch(ipt) {
        this.isOpen = false;
        this.searchValue = '';
        ipt.placeholder = this.placeholder;
        this.onClear.emit(this.searchValue);
    }

    /** search use keyword event */
    search() {
        this.isOpen = false;
        this.onSearch.emit(this.searchValue);
    }

    /** click select suggest search value */
    selectSuggestionValue(suggestionItem: string) {
        this.searchValue = suggestionItem;
        this.isOpen = false;
    }

    /**
     * listen focus on input event
     * @param ipt
     */
    onFocus(ipt) {
        ipt.placeholder = '';
    }

    /**
     * listen blur input event
     * @param ipt
     */
    onBlur(ipt) {
        let self = this;
        if (!ipt.value) {
            ipt.placeholder = this.placeholder;
        }
        // todo delay close
        // this.isOpen = false;
    }
}
