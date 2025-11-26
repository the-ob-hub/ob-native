#import "LaunchScreenViewController.h"

@implementation LaunchScreenViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // Configurar fondo blanco
    self.view.backgroundColor = [UIColor whiteColor];
    
    // Crear label "OndaBank"
    UILabel *ondaBankLabel = [[UILabel alloc] init];
    ondaBankLabel.text = @"OndaBank";
    ondaBankLabel.font = [UIFont boldSystemFontOfSize:36];
    ondaBankLabel.textColor = [UIColor blackColor];
    ondaBankLabel.textAlignment = NSTextAlignmentCenter;
    ondaBankLabel.translatesAutoresizingMaskIntoConstraints = NO;
    [self.view addSubview:ondaBankLabel];
    
    // Crear label "Lab"
    UILabel *labLabel = [[UILabel alloc] init];
    labLabel.text = @"Lab";
    labLabel.font = [UIFont italicSystemFontOfSize:20];
    labLabel.textColor = [UIColor blackColor];
    labLabel.textAlignment = NSTextAlignmentCenter;
    labLabel.translatesAutoresizingMaskIntoConstraints = NO;
    [self.view addSubview:labLabel];
    
    // Constraints para "OndaBank" - centrado horizontal y verticalmente en el tercio inferior
    [NSLayoutConstraint activateConstraints:@[
        [ondaBankLabel.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],
        [ondaBankLabel.centerYAnchor constraintEqualToAnchor:self.view.bottomAnchor multiplier:(1.0/3.0) constant:1],
    ]];
    
    // Constraints para "Lab" - debajo de "OndaBank"
    [NSLayoutConstraint activateConstraints:@[
        [labLabel.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],
        [labLabel.topAnchor constraintEqualToAnchor:ondaBankLabel.bottomAnchor constant:4],
    ]];
}

@end

