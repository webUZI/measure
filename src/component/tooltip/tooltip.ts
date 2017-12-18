import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    Output,
    Directive,
    ElementRef,
    TemplateRef,
    Renderer2,
    ViewContainerRef,
    ComponentRef,
    Injector,
    NgZone,
    EventEmitter,
    ComponentFactory,
    ComponentFactoryResolver
} from '@angular/core';

import { OnChange } from '../core/decorators';
import { TiplayerComponent } from './tiplayer';
import { ConnectionPosition, Placement } from '../util/position';
import { OverlayPositionService } from '../overlay/overlay-position.service';
import { DynamicComponentService } from '../overlay/dynamic-component.service';
import { Observable } from 'rxjs/Observable';

@Directive({
    selector: '[nbTooltip]',
    exportAs: 'nbTooltip',
    providers: [DynamicComponentService],
    host: {
        '(body:click)': 'this.handleBodyInteraction()'
    }
})

export class TooltipDirective implements OnInit, OnDestroy {

    @Input() nbTooltip: string | TemplateRef<any> = '';

    /**
     * 提示框位置信息，默认为目标元素的底部
     * 可选值为 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' |
     * 'bottom-right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'
     *
     */
    @OnChange()
    @Input() placement: Placement = 'bottom';

    /**
     * 浮层模式还是嵌入模式
     *
     */
    @OnChange(true)
    @Input() embedded: boolean = false;

    /**
     * 提示框的触发事件类型
     * 可选值为 'click' | 'hover' | 'focus'
     *
     */
    @Input() trigger: string = 'hover';

    /**
     * 是否有箭头
     *
     */
    @OnChange(true)
    @Input() hasArrow: boolean = false;

    /**
     * 提示框主题色
     * 可选值为 'default' | white' | 'pink' | 'yellow'
     * 默认是灰色
     *
     */
    @Input() nbTooltipTheme: string = 'default';

    private _content: string;
    private clickListener: Function;
    private enterListener: Function;
    private leaveListener: Function;
    private focusListener: Function;
    private blurListener: Function;
    private tiplayerInstance: TiplayerComponent | null;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private viewContainerRef: ViewContainerRef,
        private injector: Injector,
        private ngZone: NgZone,
        private componentFactoryResolver: ComponentFactoryResolver,
        private dynamicComponentService: DynamicComponentService<TiplayerComponent>,
        private overlayPositionService: OverlayPositionService) {
    }

    ngOnInit() {
        // 绑定事件
        if (this.trigger === 'hover') {
            this.enterListener =
                this.renderer.listen(this.el.nativeElement, 'mouseenter', () => this.show());
            this.leaveListener =
                this.renderer.listen(this.el.nativeElement, 'mouseleave', () => this.hide());
        }
        if (this.trigger === 'click') {
            this.clickListener =
                this.renderer.listen(this.el.nativeElement, 'click', (e) => this.handleHostClick(e));
        }
        if (this.trigger === 'focus') {
            this.focusListener =
                this.renderer.listen(this.el.nativeElement, 'focus', () => this.show());
            this.blurListener =
                this.renderer.listen(this.el.nativeElement, 'blur', () => this.hide());
        }
    }

    show() {
        if (!this.tiplayerInstance) {
            this.createTiplayer();
        }
        this.tiplayerInstance!.show();
    }

    hide() {
        if (this.tiplayerInstance) {
            this.tiplayerInstance.hide();
        }
    }

    toggle() {
        this.isTooltipVisible() ? this.hide() : this.show();
    }

    isTooltipVisible(): boolean {
        return !!this.tiplayerInstance && this.tiplayerInstance.isVisible();
    }

    handleHostClick(e) {
        this.toggle();
        e.stopPropagation();
    }

    /**
     * Opens an element’s tooltip. This is considered a “manual” triggering of the tooltip.
     * The context is an optional value to be injected into the tooltip template when it is created.
     *
     */
    createTiplayer() {
        let componentRef = this.dynamicComponentService.createDynamicComponent(
            TiplayerComponent, this.nbTooltip, window.document.body);
        this.tiplayerInstance = componentRef.instance;

        const config = {
            trigger: this.trigger,
            hasArrow: this.hasArrow,
            embedded: this.embedded,
            placement: this.placement,
            nbTooltipTheme: this.nbTooltipTheme
        };
        Object.keys(config).forEach(key => this.tiplayerInstance![key] = config[key]);

        const positionStrategy = this.overlayPositionService
            .attachTo(this.el, this.tiplayerInstance, this.placement);

        this.tiplayerInstance.needReposition.subscribe(
            () => this.overlayPositionService.updatePosition(positionStrategy)
        );
    }

    ngOnDestroy() {
        if (this.tiplayerInstance) {
            this.tiplayerInstance = null;
        }
        if (this.trigger === 'click') {
            this.clickListener();
        }
        if (this.trigger === 'hover') {
            this.enterListener();
            this.leaveListener();
        }
        if (this.trigger === 'focus') {
            this.focusListener();
            this.blurListener();
        }
    }

    handleBodyInteraction() {
        if (this.trigger === 'click') {
            this.hide();
        }
    }
}
