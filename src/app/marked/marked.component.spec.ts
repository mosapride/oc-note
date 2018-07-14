import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkedComponent } from './marked.component';

describe('MarkedComponent', () => {
  let component: MarkedComponent;
  let fixture: ComponentFixture<MarkedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
