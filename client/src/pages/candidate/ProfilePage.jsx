import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Camera,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Puzzle,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import candidateService from '../../services/candidateService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const defaultLanguages = [];

const ProfilePage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await candidateService.getProfile();
        setProfile(response.data?.data ?? null);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        showNotification('Không thể tải thông tin hồ sơ', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showNotification]);

  const displayName =
    user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Ứng viên';
  const title = profile?.title || profile?.current_job_title || 'Chuyên viên';
  const location = profile?.location || 'Hà Nội, Việt Nam';
  const email = user?.email || '—';
  const phone = profile?.phone || 'Chưa cập nhật';

  const skills = profile?.skills || [];
  const skillList = Array.isArray(skills)
    ? skills.map((s) => (typeof s === 'string' ? s : s?.name || s))
    : [];

  const languages =
    profile?.languages && profile.languages.length > 0 ? profile.languages : defaultLanguages;

  const experiences = profile?.experiences || [];
  const education = profile?.education || [];

  const lastUpdated = profile?.updated_at || user?.updated_at || new Date().toISOString();
  const lastUpdatedStr = new Date(lastUpdated).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      {/* Page title */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Hồ sơ ứng viên</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* Left column: Profile summary */}
        <div className="space-y-6">
          {/* Personal info card */}
          <Card className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="relative inline-block">
                <Avatar className="h-28 w-28 rounded-full border-4 border-primary/20">
                  <AvatarImage src={user?.avatar_url} alt={displayName} />
                  <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                    {displayName.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-white shadow">
                  <Camera className="h-4 w-4" />
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">{displayName}</h2>
              <p className="mt-1 text-sm font-medium text-primary">{title}</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {location}
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {email}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {phone}
                </li>
              </ul>
              <div className="mt-6 flex flex-col gap-2">
                <Button asChild className="w-full rounded-lg bg-primary hover:bg-primary/90">
                  <Link to="/candidate/profile/edit" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Chỉnh sửa hồ sơ
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-lg">
                  <Link to="/candidate/profile/projects/new" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    Thêm dự án
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skills card */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Puzzle className="h-4 w-4 text-primary" />
                Kỹ năng
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {skillList.length > 0 ? (
                  skillList.map((name) => (
                    <span
                      key={name}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có kỹ năng nào.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Languages card */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Globe className="h-4 w-4 text-primary" />
                Ngôn ngữ
              </h3>
              <ul className="mt-4 space-y-4">
                {languages.length > 0 ? (
                  languages.map((lang, index) => (
                    <li key={lang.id || lang.name || `lang-${index}`}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{lang.name || lang}</span>
                        <span className="text-muted-foreground">{lang.level || ''}</span>
                      </div>
                      <Progress
                        value={typeof lang.value === 'number' ? lang.value : 100}
                        className="mt-1.5 h-1.5 bg-muted"
                      />
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa cập nhật ngoại ngữ.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Main content */}
        <div className="space-y-6">
          {/* About */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-foreground">Giới thiệu bản thân</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {profile?.bio || 'Chưa có giới thiệu bản thân.'}
              </p>
            </CardContent>
          </Card>

          {/* Work experience */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-foreground">Kinh nghiệm làm việc</h3>
              <div className="mt-6 space-y-8">
                {experiences.length > 0 ? (
                  experiences.map((exp, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        {i === 0 ? (
                          <Briefcase className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {exp.title || exp.position}
                            </h4>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                          </div>
                          <span
                            className={`text-sm ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            {exp.period ||
                              (exp.startDate && exp.endDate
                                ? `${exp.startDate} - ${exp.endDate}`
                                : '') ||
                              '—'}
                          </span>
                        </div>
                        {(exp.description || exp.desc) && (
                          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {(exp.description || exp.desc)
                              .split(/\n|•|\.\s+/)
                              .filter(Boolean)
                              .slice(0, 5)
                              .map((line, j) => (
                                <li key={j}>{line.trim()}</li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có thông tin. Hãy chỉnh sửa hồ sơ để thêm kinh nghiệm.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-foreground">Học vấn</h3>
              <div className="mt-6 space-y-6">
                {education.length > 0 ? (
                  education.map((edu, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground">
                          {edu.degree || edu.major || edu.school}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {edu.school || edu.university} |{' '}
                          {edu.period ||
                            (edu.startDate && edu.endDate ? `${edu.startDate}-${edu.endDate}` : '')}
                        </p>
                        {edu.gpa && (
                          <p className="mt-1 text-sm text-muted-foreground">GPA: {edu.gpa}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa có thông tin. Hãy chỉnh sửa hồ sơ để thêm học vấn.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Hồ sơ ứng viên. Cập nhật lần cuối: {lastUpdatedStr}
      </footer>
    </div>
  );
};

export default ProfilePage;
