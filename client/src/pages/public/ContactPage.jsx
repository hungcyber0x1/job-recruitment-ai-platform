import React from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Linkedin,
  Facebook,
  Twitter,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
const ContactPage = () => {
  return (
    <>
      <div className="relative overflow-hidden pb-20 pt-8 md:pt-10">
        {/* Background Lights */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 opacity-70 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 opacity-50 -translate-x-1/2 translate-y-1/2"></div>

        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm uppercase tracking-normal mb-8">
              <Sparkles size={14} />
              Chúng tôi luôn ở đây
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 leading-[1.1] tracking-normal text-wrap-balance">
              Liên hệ với <span className="gradient-text">HireBOT</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium">
              Bạn có thắc mắc, đề xuất hợp tác hoặc cần hỗ trợ kỹ thuật? <br /> Hãy gửi lời nhắn cho
              chúng tôi.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 items-stretch">
            {/* Info Side */}
            <div className="lg:w-1/3 flex flex-col gap-8">
              {[
                {
                  icon: <Mail className="text-primary" />,
                  label: 'Email hỗ trợ',
                  val: 'contact@hirebot.vn',
                  desc: 'Chúng tôi sẽ phản hồi trong 24h.',
                },
                {
                  icon: <Phone className="text-primary" />,
                  label: 'Tổng đài 24/7',
                  val: '1900 6789 (nhánh 1)',
                  desc: 'Hỗ trợ khẩn cấp cho cả Ứng viên & HR.',
                },
                {
                  icon: <MapPin className="text-amber-500" />,
                  label: 'Văn phòng đại diện',
                  val: 'Tòa nhà TechHub, Q1, HCM',
                  desc: 'Ghé thăm chúng tôi để hợp tác Trực tiếp.',
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="p-8 border shadow-xl shadow-slate-100/50 hover-lift flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center mb-6">
                    {React.cloneElement(item.icon, { size: 28 })}
                  </div>
                  <p className="text-base font-bold text-slate-400 uppercase tracking-normal mb-2">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold text-slate-900 mb-2">{item.val}</p>
                  <p className="text-base font-medium text-slate-500">{item.desc}</p>
                </Card>
              ))}

              {/* Social Icons */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white">
                <p className="text-center text-base font-bold text-slate-500 uppercase tracking-normal mb-6">
                  Theo dõi mạng xã hội
                </p>
                <div className="flex justify-center gap-6">
                  {[
                    { Icon: Linkedin, key: 'linkedin' },
                    { Icon: Facebook, key: 'facebook' },
                    { Icon: Twitter, key: 'twitter' },
                  ].map(({ Icon, key }) => (
                    <button
                      key={key}
                      className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-primary transition-all hover:-translate-y-1"
                    >
                      <Icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Side */}
            <div className="lg:w-2/3">
              <Card className="p-10 md:p-16 h-full border-none shadow-2xl shadow-primary/10 flex flex-col">
                <div className="mb-12">
                  <h3 className="text-3xl font-bold text-slate-900 mb-2">Gửi tin nhắn phản hồi</h3>
                  <p className="text-slate-500 font-medium">
                    Chúng tôi trân trọng mọi ý đóng đóng góp từ phía bạn.
                  </p>
                </div>

                <form className="space-y-8 flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-base font-bold text-slate-900 uppercase tracking-normal ml-1 mb-2 block">
                        Họ và tên
                      </label>
                      <input
                        placeholder="Nguyễn Văn A"
                        className="w-full px-6 py-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus:border-primary transition-all font-medium text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-base font-bold text-slate-900 uppercase tracking-normal ml-1 mb-2 block">
                        Email nhận phản hồi
                      </label>
                      <input
                        type="email"
                        placeholder="example@hirebot.vn"
                        className="w-full px-6 py-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus:border-primary transition-all font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-base font-bold text-slate-900 uppercase tracking-normal ml-1 mb-2 block">
                      Chủ đề cần hỗ trợ
                    </label>
                    <Select defaultValue="employer">
                      <SelectTrigger className="w-full h-[58px] px-6 rounded-xl bg-slate-50 border-slate-100 font-medium text-slate-700 focus:ring-4 focus:ring-primary/10 shadow-none">
                        <SelectValue placeholder="Chủ đề cần hỗ trợ" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-xl">
                        <SelectItem value="employer" className="text-base font-medium py-3">
                          Tôi muốn hợp tác Employer
                        </SelectItem>
                        <SelectItem value="bug" className="text-base font-medium py-3">
                          Báo lỗi hệ thống kỹ thuật
                        </SelectItem>
                        <SelectItem value="candidate" className="text-base font-medium py-3">
                          Giải đáp quyền lợi ứng viên
                        </SelectItem>
                        <SelectItem value="other" className="text-base font-medium py-3">
                          Vấn đề khác
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-base font-bold text-slate-900 uppercase tracking-normal ml-1 mb-2 block">
                      Nội dung chi tiết
                    </label>
                    <textarea
                      rows="6"
                      placeholder="Hãy mô tả chi tiết vấn đề bạn đang gặp phải…"
                      className="w-full px-6 py-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus:border-primary transition-all font-medium text-slate-700 resize-none"
                    ></textarea>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full py-5 text-xl font-bold rounded-[24px] shadow-xl shadow-primary/20 group"
                  >
                    Gửi tin nhắn đi
                    <Send
                      size={20}
                      className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                    />
                  </Button>
                </form>

                {/* AI Assistant Banner */}
                <div className="mt-12 p-8 bg-primary/5 rounded-[32px] border border-primary/10 flex flex-col md:flex-row items-center gap-6 justify-between group cursor-pointer hover:bg-card transition-colors duration-200 ease-out">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white shadow-xl shadow-primary/10 flex items-center justify-center text-primary">
                      <MessageSquare size={28} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">Muốn câu trả lời nhanh hơn?</p>
                      <p className="text-base text-primary font-bold">
                        Trò chuyện trực tiếp với HireBOT Chatbot
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={24}
                    className="text-primary/60 group-hover:translate-x-2 transition-transform"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
