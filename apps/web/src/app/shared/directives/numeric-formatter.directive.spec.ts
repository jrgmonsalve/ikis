import { Component, DebugElement } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NumericFormatterDirective } from './numeric-formatter.directive';

@Component({
  template: `
    <input [(ngModel)]="value" appNumericFormatter />
  `,
  standalone: true,
  imports: [FormsModule, NumericFormatterDirective]
})
class TestComponent {
  value: number | null = null;
}

describe('NumericFormatterDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let inputEl: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent]
    });
    fixture = TestBed.createComponent(TestComponent);
    inputEl = fixture.debugElement.query(By.css('input'));
    fixture.detectChanges();
  });

  it('should format numbers correctly on writeValue', async () => {
    fixture.componentInstance.value = 10000;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(inputEl.nativeElement.value).toBe('10.000');
  });

  it('should handle deletion of characters without breaking to decimal', async () => {
    fixture.componentInstance.value = 10000;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(inputEl.nativeElement.value).toBe('10.000');

    // Simulate deleting the last character '0' -> value becomes '10.00'
    const inputElement = inputEl.nativeElement as HTMLInputElement;
    inputElement.value = '10.00';
    
    // Dispatch input event with inputType 'deleteContentBackward'
    const event = new InputEvent('input', {
      inputType: 'deleteContentBackward',
      bubbles: true,
      cancelable: true
    });
    inputElement.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(inputElement.value).toBe('1.000');
    expect(fixture.componentInstance.value).toBe(1000);
  });

  it('should parse pasted values with dot decimals properly', async () => {
    const inputElement = inputEl.nativeElement as HTMLInputElement;
    inputElement.value = '12.5';
    
    const event = new InputEvent('input', {
      inputType: 'insertFromPaste',
      bubbles: true,
      cancelable: true
    });
    inputElement.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(inputElement.value).toBe('12,5');
    expect(fixture.componentInstance.value).toBe(12.5);
  });
});
