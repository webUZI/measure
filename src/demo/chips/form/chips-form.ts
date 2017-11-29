import {Input, Component, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
    selector: 'demo-chips-form',
    templateUrl: './chips-form.html',
    styleUrls: ['./chips-form.less'],
    encapsulation: ViewEncapsulation.None
})
export class DemoChipsForm {

    form: FormGroup;
    chipsArray: Array<any> = ['hello','world'];
    constructor(private fb: FormBuilder) {}

    ngOnInit() {
        this.form = this.fb.group({
            chips: [
                {value: this.chipsArray, disabled: false}
            ]
        });
    }
}
