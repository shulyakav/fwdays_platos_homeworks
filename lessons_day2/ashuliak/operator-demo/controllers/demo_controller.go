package controllers

import (
	"context"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"

	appsv1 "my.domain/demo/api/v1"
)

// DemoReconciler reconciles a Demo object
type DemoReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=apps.my.domain,resources=demos,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=apps.my.domain,resources=demos/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=apps.my.domain,resources=demos/finalizers,verbs=update

func (r *DemoReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	// Fetch the Demo instance
	demo := &appsv1.Demo{}
	if err := r.Get(ctx, req.NamespacedName, demo); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// Update status
	demo.Status.AvailableReplicas = demo.Spec.Replicas
	demo.Status.LastUpdated = metav1.Now()

	if err := r.Status().Update(ctx, demo); err != nil {
		log.Error(err, "Failed to update Demo status")
		return ctrl.Result{}, err
	}

	return ctrl.Result{RequeueAfter: time.Minute}, nil
}

func (r *DemoReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&appsv1.Demo{}).
		Complete(r)
}
