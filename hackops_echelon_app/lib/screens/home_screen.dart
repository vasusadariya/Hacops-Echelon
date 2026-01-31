import 'package:flutter/material.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/hero_section.dart';
import '../widgets/quick_links.dart';
import '../widgets/how_it_works.dart';
import '../widgets/services_section.dart';
import '../widgets/app_footer.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(),
      body: SingleChildScrollView(
        child: Column(
          children: const [
            HeroSection(),
            QuickLinks(),
            HowItWorks(),
            ServicesSection(),
            AppFooter(),
          ],
        ),
      ),
    );
  }
}