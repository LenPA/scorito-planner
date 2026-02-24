import { Component, Output, EventEmitter } from '@angular/core';
import { SelectionService } from '../selection.service';
import { Rider } from '../types';

@Component({
    selector: 'app-team-summary',
    template: `
    <div class="modal fade show d-block" tabindex="-1" role="dialog" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">My Selection ({{selectionService.riderCount}}/20)</h5>
            <button type="button" class="close" (click)="close()">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              Remaining Budget: {{formatCurrency(selectionService.remainingBudget)}}
            </div>
            
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Team</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let rider of selectionService.selectedRiders$ | async">
                  <td>{{rider.firstName}} {{rider.lastName}}</td>
                  <td>{{rider.team.name}}</td>
                  <td>{{formatCurrency(rider.price)}}</td>
                  <td>
                    <button class="btn btn-sm btn-danger" (click)="remove(rider)">
                      <i class="fa fa-times"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [],
    standalone: false
})
export class TeamSummaryComponent {
    @Output() onClose = new EventEmitter<void>();
    private readonly currencyFormatter = new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    });

    constructor(public selectionService: SelectionService) { }

    close() {
        this.onClose.emit();
    }

    remove(rider: Rider) {
        this.selectionService.removeRider(rider);
    }

    formatCurrency(amount: number) {
        return this.currencyFormatter.format(amount);
    }
}
