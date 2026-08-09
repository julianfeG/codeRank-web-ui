import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'recruiter' },

  {
    path: 'login',
    loadComponent: () => import('./features/recruiter/login/login.component').then((m) => m.Login),
  },

  {
    path: 'recruiter',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/recruiter/assessment-list/assessment-list.component').then(
            (m) => m.AssessmentList,
          ),
      },
      {
        path: 'assessments/new',
        loadComponent: () =>
          import('./features/recruiter/create-assessment/create-assessment.component').then(
            (m) => m.CreateAssessment,
          ),
      },
      {
        path: 'questions',
        loadComponent: () =>
          import('./features/recruiter/question-bank/question-bank.component').then(
            (m) => m.QuestionBank,
          ),
      },
      {
        path: 'assessments/:assessmentId/submissions',
        pathMatch: 'full',
        loadComponent: () =>
          import(
            './features/recruiter/assessment-submissions/assessment-submissions.component'
          ).then((m) => m.AssessmentSubmissions),
      },
      {
        path: 'assessments/:assessmentId/submissions/:submissionId',
        loadComponent: () =>
          import('./shared/submission-result/submission-result.component').then(
            (m) => m.SubmissionResultView,
          ),
      },
    ],
  },

  {
    // Wraps the whole candidate flow — not a guard, since the constraint (viewport size)
    // can change live via window resize, not just at navigation time. See DesktopGate.
    path: 'candidate',
    loadComponent: () =>
      import('./features/candidate/desktop-gate/desktop-gate.component').then((m) => m.DesktopGate),
    children: [
      {
        path: 'start/:assessmentId',
        loadComponent: () =>
          import('./features/candidate/start-submission/start-submission.component').then(
            (m) => m.StartSubmission,
          ),
      },
      {
        path: 'submissions/:submissionId/resolve',
        loadComponent: () =>
          import('./features/candidate/resolve-assessment/resolve-assessment.component').then(
            (m) => m.ResolveAssessment,
          ),
      },
      {
        path: 'submissions/:submissionId/results',
        loadComponent: () =>
          import('./shared/submission-result/submission-result.component').then(
            (m) => m.SubmissionResultView,
          ),
      },
    ],
  },
];
